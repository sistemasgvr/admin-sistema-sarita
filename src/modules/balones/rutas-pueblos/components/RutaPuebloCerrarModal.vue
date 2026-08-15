<template>
  <AppModal
    v-model="open"
    title="Cerrar ruta"
    subtitle="Compara el gas calculado por libras con lo que reportó el repartidor."
    size="md"
  >
    <div v-if="rutaQuery.isPending.value" class="py-8 text-center text-sm text-gray-500">
      Cargando…
    </div>
    <div v-else-if="ruta" class="space-y-4">
      <div class="rounded-lg bg-gray-50 p-3 text-sm dark:bg-white/5">
        <div class="flex justify-between">
          <span class="text-gray-500">Gas calculado (por libras)</span>
          <span class="font-medium tabular-nums">{{ Number(ruta.m3_calculado ?? 0).toFixed(3) }} m³</span>
        </div>
        <div class="mt-1 flex justify-between">
          <span class="text-gray-500">Diferencia permitida</span>
          <span class="tabular-nums">± {{ Number(ruta.tolerancia_m3 ?? 0).toFixed(3) }} m³</span>
        </div>
      </div>
      <AppInput
        v-model="m3Reportado"
        label="Gas reportado por el repartidor (m³)"
        type="number"
        step="0.001"
        min="0"
        required
        hint="Ventas de la ruta según el repartidor"
      />
      <AppInput v-model="observacion" label="Observación" placeholder="Opcional" />
      <p v-if="previewDescuadre !== null" class="text-xs" :class="alertaClass">
        Diferencia: {{ previewDescuadre.toFixed(3) }} m³
        {{
          Math.abs(previewDescuadre) > Number(ruta.tolerancia_m3 ?? 0.5)
            ? '(aviso: fuera del margen; igual se puede cerrar)'
            : '(dentro del margen)'
        }}
      </p>
    </div>

    <template #footer>
      <button
        type="button"
        class="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium"
        @click="open = false"
      >
        Cancelar
      </button>
      <button
        type="button"
        class="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60"
        :disabled="cerrarMutation.isPending.value || rutaQuery.isPending.value || !ruta || m3Reportado === ''"
        @click="guardar"
      >
        Cerrar ruta
      </button>
    </template>
  </AppModal>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRutaPuebloQuery } from '@/modules/balones/rutas-pueblos/composables/useRutasPueblosQuery'
import { useCerrarRutaPuebloMutation } from '@/modules/balones/rutas-pueblos/composables/useRutasPueblosMutations'
import { AppInput, AppModal } from '@/shared/components'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { toastWarning } from '@/shared/composables/useToast'

const open = defineModel<boolean>({ default: false })
const props = defineProps<{ rutaId: number | null }>()
const emit = defineEmits<{ saved: [] }>()

const authStore = useAuthStore()
const rutaIdRef = computed(() => (open.value ? props.rutaId : null))
const rutaQuery = useRutaPuebloQuery(rutaIdRef)
const cerrarMutation = useCerrarRutaPuebloMutation()
const ruta = computed(() => rutaQuery.data.value)

const m3Reportado = ref('')
const observacion = ref('')

watch(open, (v) => {
  if (!v) return
  m3Reportado.value =
    ruta.value?.m3_reportado_ventas != null ? String(ruta.value.m3_reportado_ventas) : ''
  observacion.value = ''
})

watch(
  () => rutaQuery.data.value,
  (data) => {
    if (!open.value || m3Reportado.value !== '') return
    if (data?.m3_reportado_ventas != null) m3Reportado.value = String(data.m3_reportado_ventas)
  },
)

const previewDescuadre = computed(() => {
  if (m3Reportado.value === '' || !ruta.value) return null
  const n = Number(m3Reportado.value)
  if (!Number.isFinite(n)) return null
  return Number(ruta.value.m3_calculado ?? 0) - n
})

const alertaClass = computed(() => {
  const d = previewDescuadre.value
  if (d === null) return 'text-gray-500'
  return Math.abs(d) > Number(ruta.value?.tolerancia_m3 ?? 0.5)
    ? 'font-medium text-warning-600'
    : 'text-success-600'
})

async function guardar() {
  const userId = authStore.user?.id
  const id = props.rutaId
  if (!userId || !id) return
  if (rutaQuery.isPending.value || !ruta.value) return

  const n = Number(m3Reportado.value)
  if (!Number.isFinite(n) || n < 0) {
    toastWarning('Indica los m³ reportados (≥ 0)')
    return
  }

  await cerrarMutation.mutateAsync({
    id,
    payload: {
      idUsuarioAuditoria: userId,
      m3ReportadoVentas: n,
      observacion: observacion.value.trim() || undefined,
    },
  })
  open.value = false
  emit('saved')
}
</script>
