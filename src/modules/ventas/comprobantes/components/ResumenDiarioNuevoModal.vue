<template>
  <AppModal
    v-model="open"
    title="Nuevo resumen diario"
    subtitle="Enviar boletas del día a SUNAT"
    size="xl"
  >
    <div class="space-y-4">
      <DetailSectionCard title="Filtro" :icon="ICONS.calendar" :full-width="true">
        <div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <AppInput
            v-model="fecha"
            label="Fecha del resumen"
            type="date"
            :disabled="busy"
            required
          />
          <AppInput
            v-model="correlativo"
            label="Correlativo"
            placeholder="001"
            :disabled="busy"
          />
          <div class="flex items-end">
            <button
              type="button"
              class="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60 dark:border-gray-700 dark:text-gray-300"
              :disabled="busy || !fecha"
              @click="cargarPreview"
            >
              <AppIcon
                :name="ICONS.refreshCw"
                :size="16"
                :class="{ 'animate-spin': previewLoading }"
              />
              Actualizar preview
            </button>
          </div>
        </div>
      </DetailSectionCard>

      <DetailSectionCard title="Comprobantes a incluir" :icon="ICONS.clipboardList" :full-width="true">
        <div
          v-if="previewLoading"
          class="py-6 text-center text-sm text-gray-500 dark:text-gray-400"
        >
          Cargando boletas...
        </div>
        <div v-else-if="preview" class="space-y-3">
          <div class="flex flex-wrap gap-3 text-sm text-gray-600 dark:text-gray-300">
            <span>
              Cantidad:
              <strong class="text-gray-800 dark:text-white/90">{{ preview.cantidad }}</strong>
            </span>
            <span>
              Total:
              <strong class="tabular-nums text-gray-800 dark:text-white/90">
                {{ formatMoney(preview.total) }}
              </strong>
            </span>
          </div>

          <div
            v-if="!preview.items.length"
            class="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300"
          >
            No hay boletas ni notas de crédito (serie B) para esa fecha.
          </div>

          <div
            v-else
            class="max-h-64 overflow-auto rounded-xl border border-gray-200 dark:border-gray-800"
          >
            <table class="min-w-full text-sm">
              <thead class="sticky top-0 bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th class="px-3 py-2 text-left">Comprobante</th>
                  <th class="px-3 py-2 text-left">Cliente</th>
                  <th class="px-3 py-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="item in preview.items"
                  :key="item.id"
                  class="border-t border-gray-100 dark:border-gray-800"
                >
                  <td class="px-3 py-2 font-medium text-gray-800 dark:text-white/90">
                    {{ item.serie }}-{{ item.numero }}
                  </td>
                  <td class="px-3 py-2">{{ item.nombre_cliente ?? '—' }}</td>
                  <td class="px-3 py-2 text-right tabular-nums">
                    {{ formatMoney(Number(item.total_importe ?? 0)) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </DetailSectionCard>
    </div>

    <template #footer>
      <button
        type="button"
        class="inline-flex items-center justify-center gap-1.5 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
        :disabled="busy"
        @click="open = false"
      >
        Cancelar
      </button>
      <button
        type="button"
        class="inline-flex items-center justify-center gap-1.5 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-70"
        :disabled="busy || !preview?.items.length"
        @click="enviar"
      >
        <AppIcon
          v-if="!enviarMutation.isPending.value"
          :name="ICONS.clipboardCheck"
          :size="16"
        />
        <AppIcon v-else :name="ICONS.refreshCw" :size="16" class="animate-spin" />
        {{ enviarMutation.isPending.value ? 'Enviando...' : 'Enviar resumen' }}
      </button>
    </template>
  </AppModal>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useEnviarResumenDiarioMutation } from '@/modules/ventas/comprobantes/composables/useComprobanteMutations'
import type { ResumenDiarioPreview } from '@/modules/ventas/comprobantes/interfaces/comprobante.interface'
import { comprobantesService } from '@/modules/ventas/comprobantes/services/comprobantes.service'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import DetailSectionCard from '@/shared/components/detail/DetailSectionCard.vue'
import { AppInput, AppModal } from '@/shared/components'
import AppIcon from '@/shared/components/AppIcon.vue'
import { toastApiError } from '@/shared/composables/useToast'
import { ICONS } from '@/shared/constants/icons'

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  created: [id: number]
}>()

const authStore = useAuthStore()
const enviarMutation = useEnviarResumenDiarioMutation()

const fecha = ref(new Date().toISOString().slice(0, 10))
const correlativo = ref('001')
const preview = ref<ResumenDiarioPreview | null>(null)
const previewLoading = ref(false)

const open = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value),
})

const busy = computed(() => previewLoading.value || enviarMutation.isPending.value)

watch(
  () => props.modelValue,
  async (isOpen) => {
    if (!isOpen) return
    fecha.value = new Date().toISOString().slice(0, 10)
    await syncCorrelativo()
    await cargarPreview()
  },
)

watch(fecha, async () => {
  if (!props.modelValue) return
  await syncCorrelativo()
  await cargarPreview()
})

function formatMoney(value: number) {
  return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(value)
}

async function syncCorrelativo() {
  if (!fecha.value) return
  try {
    const data = await comprobantesService.siguienteCorrelativoResumen(fecha.value)
    correlativo.value = data.correlativo || '001'
  } catch {
    correlativo.value = '001'
  }
}

async function cargarPreview() {
  if (!fecha.value) return
  previewLoading.value = true
  try {
    preview.value = await comprobantesService.previewResumenDiario(fecha.value)
  } catch (error) {
    preview.value = null
    toastApiError(error, 'No se pudo cargar el preview del resumen')
  } finally {
    previewLoading.value = false
  }
}

async function enviar() {
  const userId = authStore.user?.id
  if (!userId || !preview.value?.items.length) return

  try {
    const result = await enviarMutation.mutateAsync({
      idUsuarioAuditoria: userId,
      fecha: fecha.value,
      correlativo: correlativo.value.trim() || '001',
      idsComprobante: preview.value.items.map((item) => item.id),
    })
    open.value = false
    emit('created', result.resumen.id)
  } catch {
    // toast en mutación
  }
}
</script>
