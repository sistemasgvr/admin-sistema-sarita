<template>
  <AppModal v-model="open" title="Detalle de compra" :subtitle="compraLabel" size="lg">
    <div v-if="compraQuery.isLoading.value" class="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
      Cargando...
    </div>

    <div v-else-if="compra" class="space-y-4">
      <DetailSectionCard title="Datos" :icon="ICONS.receipt" :full-width="true">
        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <p class="text-xs text-gray-500 dark:text-gray-400">Comprobante</p>
            <p class="font-medium text-gray-800 dark:text-white/90">
              {{ compra.serie ?? '—' }}-{{ compra.numero ?? '—' }}
            </p>
          </div>
          <div>
            <p class="text-xs text-gray-500 dark:text-gray-400">Tipo</p>
            <p class="font-medium text-gray-800 dark:text-white/90">
              {{ compra.nombre_tipo_comprobante ?? '—' }}
            </p>
          </div>
          <div>
            <p class="text-xs text-gray-500 dark:text-gray-400">Proveedor</p>
            <p class="font-medium text-gray-800 dark:text-white/90">
              {{ compra.razon_social_proveedor ?? '—' }}
            </p>
          </div>
          <div>
            <p class="text-xs text-gray-500 dark:text-gray-400">Documento proveedor</p>
            <p class="font-medium text-gray-800 dark:text-white/90">
              {{ compra.doc_proveedor ?? '—' }}
            </p>
          </div>
          <div>
            <p class="text-xs text-gray-500 dark:text-gray-400">Tipo registro</p>
            <p class="font-medium text-gray-800 dark:text-white/90">
              {{ compra.nombre_tipo_registro ?? '—' }}
            </p>
          </div>
          <div>
            <p class="text-xs text-gray-500 dark:text-gray-400">Categoría gasto</p>
            <p class="font-medium text-gray-800 dark:text-white/90">
              {{ compra.nombre_categoria_gasto ?? '—' }}
            </p>
          </div>
          <div>
            <p class="text-xs text-gray-500 dark:text-gray-400">Sucursal</p>
            <p class="font-medium text-gray-800 dark:text-white/90">
              {{ compra.nombre_sucursal ?? '—' }}
            </p>
          </div>
          <div>
            <p class="text-xs text-gray-500 dark:text-gray-400">Almacén</p>
            <p class="font-medium text-gray-800 dark:text-white/90">
              {{ compra.nombre_almacen ?? '—' }}
            </p>
          </div>
          <div>
            <p class="text-xs text-gray-500 dark:text-gray-400">Moneda</p>
            <p class="font-medium text-gray-800 dark:text-white/90">
              {{ compra.nombre_moneda ?? '—' }}
            </p>
          </div>
          <div>
            <p class="text-xs text-gray-500 dark:text-gray-400">Condición pago</p>
            <p class="font-medium text-gray-800 dark:text-white/90">
              {{ compra.nombre_condicion_pago ?? '—' }}
            </p>
          </div>
          <div>
            <p class="text-xs text-gray-500 dark:text-gray-400">Fecha</p>
            <p class="font-medium text-gray-800 dark:text-white/90">{{ compra.fecha }}</p>
          </div>
          <div>
            <p class="text-xs text-gray-500 dark:text-gray-400">Estado</p>
            <p class="font-medium text-gray-800 dark:text-white/90">
              {{ compra.nombre_estado ?? '—' }}
            </p>
          </div>
        </div>
        <div v-if="compra.glosa" class="mt-3">
          <p class="text-xs text-gray-500 dark:text-gray-400">Glosa</p>
          <p class="font-medium text-gray-800 dark:text-white/90">{{ compra.glosa }}</p>
        </div>
        <div class="mt-3 grid grid-cols-3 gap-3 rounded-lg bg-gray-50 p-3 dark:bg-white/5">
          <div>
            <p class="text-xs text-gray-500 dark:text-gray-400">Sub total</p>
            <p class="font-semibold text-gray-800 dark:text-white/90">
              {{ formatMoney(compra.sub_total ?? 0) }}
            </p>
          </div>
          <div>
            <p class="text-xs text-gray-500 dark:text-gray-400">IGV</p>
            <p class="font-semibold text-gray-800 dark:text-white/90">
              {{ formatMoney(compra.igv ?? 0) }}
            </p>
          </div>
          <div>
            <p class="text-xs text-gray-500 dark:text-gray-400">Total</p>
            <p class="font-semibold text-gray-800 dark:text-white/90">
              {{ formatMoney(compra.total_importe) }}
            </p>
          </div>
        </div>
      </DetailSectionCard>

      <DetailSectionCard title="Detalle" :icon="ICONS.clipboardList" :full-width="true">
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
              <tr v-for="det in compra.detalles" :key="det.id ?? det.item" class="border-t border-gray-100 dark:border-gray-800">
                <td class="px-3 py-2">
                  {{ det.descripcion }}
                  <span v-if="det.observacion" class="ml-1 text-xs text-gray-400">({{ det.observacion }})</span>
                </td>
                <td class="px-3 py-2 text-right tabular-nums">{{ det.cantidad }}</td>
                <td class="px-3 py-2 text-right tabular-nums">{{ det.precio_unitario != null ? formatMoney(det.precio_unitario) : '—' }}</td>
                <td class="px-3 py-2 text-right tabular-nums">{{ formatMoney(det.importe) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </DetailSectionCard>
    </div>

    <template #footer>
      <button type="button" class="inline-flex items-center justify-center gap-1.5 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300" @click="open = false">
        Cerrar
      </button>
    </template>
  </AppModal>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useCompraQuery } from '@/modules/compras/composables/useComprasQuery'
import DetailSectionCard from '@/shared/components/detail/DetailSectionCard.vue'
import { AppModal } from '@/shared/components'
import { ICONS } from '@/shared/constants/icons'

const props = defineProps<{
  modelValue: boolean
  compraId: number | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const open = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value),
})

const compraId = computed(() => (props.modelValue ? props.compraId : null))
const compraQuery = useCompraQuery(compraId)
const compra = computed(() => compraQuery.data.value ?? null)

const compraLabel = computed(() => {
  if (!compra.value) return undefined
  return `${compra.value.serie ?? '—'}-${compra.value.numero ?? '—'}`
})

function formatMoney(value: number) {
  return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(value)
}
</script>
