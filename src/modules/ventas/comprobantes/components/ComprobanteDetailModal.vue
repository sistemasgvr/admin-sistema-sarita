<template>
  <AppModal
    v-model="open"
    title="Detalle de comprobante"
    size="xl"
    @close="handleClose"
  >
    <div
      v-if="comprobanteQuery.isLoading.value"
      class="py-8 text-center text-sm text-gray-500 dark:text-gray-400"
    >
      Cargando comprobante...
    </div>

    <div v-else-if="comprobante" class="space-y-4">
      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <p class="text-xs text-gray-500 dark:text-gray-400">Comprobante</p>
          <p class="font-medium text-gray-800 dark:text-white/90">
            {{ comprobante.serie }}-{{ comprobante.numero }}
          </p>
        </div>
        <div>
          <p class="text-xs text-gray-500 dark:text-gray-400">Cliente</p>
          <p class="font-medium text-gray-800 dark:text-white/90">
            {{ comprobante.nombre_cliente ?? '—' }}
          </p>
        </div>
        <div>
          <p class="text-xs text-gray-500 dark:text-gray-400">Fecha</p>
          <p class="text-gray-700 dark:text-gray-300">{{ comprobante.fecha }}</p>
        </div>
        <div>
          <p class="text-xs text-gray-500 dark:text-gray-400">Estado SUNAT</p>
          <AppBadge variant="light" :color="sunatBadgeColor">
            {{ comprobante.nombre_estado_sunat ?? 'PENDIENTE' }}
          </AppBadge>
        </div>
      </div>

      <div class="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
        <table class="min-w-full text-sm">
          <thead class="bg-gray-50 dark:bg-white/5">
            <tr>
              <th class="px-3 py-2 text-left">Producto</th>
              <th class="px-3 py-2 text-right">Cant.</th>
              <th class="px-3 py-2 text-right">P. unit.</th>
              <th class="px-3 py-2 text-right">Importe</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="detalle in comprobante.detalles"
              :key="detalle.id ?? `${detalle.id_producto}-${detalle.item}`"
              class="border-t border-gray-100 dark:border-gray-800"
            >
              <td class="px-3 py-2">
                {{ detalle.descripcion || detalle.nombre_producto || detalle.id_producto }}
              </td>
              <td class="px-3 py-2 text-right tabular-nums">{{ detalle.cantidad }}</td>
              <td class="px-3 py-2 text-right tabular-nums">
                {{ formatMoney(Number(detalle.precio_unitario)) }}
              </td>
              <td class="px-3 py-2 text-right tabular-nums">
                {{ formatMoney(Number(detalle.importe ?? 0)) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="flex flex-col items-end gap-1 text-sm">
        <p>Subtotal: {{ formatMoney(Number(comprobante.sub_total ?? 0)) }}</p>
        <p>IGV: {{ formatMoney(Number(comprobante.igv ?? 0)) }}</p>
        <p class="text-base font-semibold text-gray-800 dark:text-white/90">
          Total: {{ formatMoney(Number(comprobante.total_importe ?? 0)) }}
        </p>
      </div>
    </div>

    <template #footer>
      <button
        type="button"
        class="inline-flex justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
        @click="handleClose"
      >
        Cerrar
      </button>
    </template>
  </AppModal>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useComprobanteQuery } from '@/modules/ventas/comprobantes/composables/useComprobantesQuery'
import { AppBadge, AppModal } from '@/shared/components'

const props = defineProps<{
  modelValue: boolean
  comprobanteId: number | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const open = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value),
})

const comprobanteIdRef = ref<number | null>(null)
const comprobanteQuery = useComprobanteQuery(comprobanteIdRef)

watch(
  () => props.comprobanteId,
  (id) => {
    comprobanteIdRef.value = open.value ? id : null
  },
  { immediate: true },
)

watch(open, (isOpen) => {
  comprobanteIdRef.value = isOpen ? props.comprobanteId : null
})

const comprobante = computed(() => comprobanteQuery.data.value)

const sunatBadgeColor = computed(() => {
  const estado = comprobante.value?.nombre_estado_sunat?.toUpperCase()
  if (estado === 'ACEPTADO') return 'success'
  if (estado === 'RECHAZADO') return 'error'
  return 'warning'
})

const formatMoney = (value: number) =>
  new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(value)

function handleClose() {
  open.value = false
}
</script>
