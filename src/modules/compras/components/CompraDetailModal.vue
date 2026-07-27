<template>
  <AppModal v-model="open" title="Detalle de compra" :subtitle="compraLabel" size="lg">
    <div v-if="compraQuery.isLoading.value" class="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
      Cargando...
    </div>

    <div v-else-if="cabecera" class="space-y-4">
      <DetailSectionCard title="Datos" :icon="ICONS.receipt" :full-width="true">
        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <p class="text-xs text-gray-500 dark:text-gray-400">Comprobante</p>
            <p class="font-medium text-gray-800 dark:text-white/90">
              {{ cabecera.serie ?? '—' }}-{{ cabecera.numero ?? '—' }}
            </p>
          </div>
          <div>
            <p class="text-xs text-gray-500 dark:text-gray-400">Tipo</p>
            <p class="font-medium text-gray-800 dark:text-white/90">
              {{ cabecera.tipo_comprobante ?? '—' }}
            </p>
          </div>
          <div>
            <p class="text-xs text-gray-500 dark:text-gray-400">Proveedor</p>
            <p class="font-medium text-gray-800 dark:text-white/90">
              {{ cabecera.proveedor ?? '—' }}
            </p>
          </div>
          <div>
            <p class="text-xs text-gray-500 dark:text-gray-400">Documento proveedor</p>
            <p class="font-medium text-gray-800 dark:text-white/90">
              {{ cabecera.proveedor_documento ?? '—' }}
            </p>
          </div>
          <div>
            <p class="text-xs text-gray-500 dark:text-gray-400">Tipo registro</p>
            <p class="font-medium text-gray-800 dark:text-white/90">
              {{ cabecera.tipo_registro ?? '—' }}
            </p>
          </div>
          <div>
            <p class="text-xs text-gray-500 dark:text-gray-400">Categoría gasto</p>
            <p class="font-medium text-gray-800 dark:text-white/90">
              {{ cabecera.categoria_gasto ?? '—' }}
            </p>
          </div>
          <div>
            <p class="text-xs text-gray-500 dark:text-gray-400">Sucursal</p>
            <p class="font-medium text-gray-800 dark:text-white/90">
              {{ cabecera.sucursal ?? '—' }}
            </p>
          </div>
          <div>
            <p class="text-xs text-gray-500 dark:text-gray-400">Almacén</p>
            <p class="font-medium text-gray-800 dark:text-white/90">
              {{ cabecera.almacen ?? '—' }}
            </p>
          </div>
          <div>
            <p class="text-xs text-gray-500 dark:text-gray-400">Moneda</p>
            <p class="font-medium text-gray-800 dark:text-white/90">
              {{ cabecera.moneda ?? '—' }}
            </p>
          </div>
          <div>
            <p class="text-xs text-gray-500 dark:text-gray-400">Condición pago</p>
            <p class="font-medium text-gray-800 dark:text-white/90">
              {{ cabecera.condicion_pago ?? '—' }}
            </p>
          </div>
          <div>
            <p class="text-xs text-gray-500 dark:text-gray-400">Fecha</p>
            <p class="font-medium text-gray-800 dark:text-white/90">{{ cabecera.fecha }}</p>
          </div>
          <div>
            <p class="text-xs text-gray-500 dark:text-gray-400">Estado</p>
            <p class="font-medium" :class="cabecera.estado === 1 ? 'text-success-600' : 'text-error-600'">
              {{ cabecera.estado === 1 ? 'Activo' : 'Anulado' }}
            </p>
          </div>
        </div>

        <div v-if="cabecera.id_comprobante_referencia" class="mt-3 rounded-lg bg-brand-50 p-3 text-sm text-brand-700 dark:bg-brand-500/10 dark:text-brand-300">
          Corrige a compra anulada ID {{ cabecera.id_comprobante_referencia }}
        </div>

        <div v-if="cabecera.glosa" class="mt-3">
          <p class="text-xs text-gray-500 dark:text-gray-400">Glosa</p>
          <p class="font-medium text-gray-800 dark:text-white/90">{{ cabecera.glosa }}</p>
        </div>

        <div class="mt-3 grid grid-cols-3 gap-3 rounded-lg bg-gray-50 p-3 dark:bg-white/5">
          <div>
            <p class="text-xs text-gray-500 dark:text-gray-400">Sub total</p>
            <p class="font-semibold text-gray-800 dark:text-white/90">
              {{ formatMoney(cabecera.sub_total ?? 0) }}
            </p>
          </div>
          <div>
            <p class="text-xs text-gray-500 dark:text-gray-400">IGV</p>
            <p class="font-semibold text-gray-800 dark:text-white/90">
              {{ formatMoney(cabecera.igv ?? 0) }}
            </p>
          </div>
          <div>
            <p class="text-xs text-gray-500 dark:text-gray-400">Total</p>
            <p class="font-semibold text-gray-800 dark:text-white/90">
              {{ formatMoney(cabecera.total_importe) }}
            </p>
          </div>
        </div>

        <div class="mt-3 flex flex-wrap items-center gap-4 text-xs">
          <span v-if="cabecera.declarar_sunat" class="inline-flex items-center gap-1 rounded-full bg-brand-100 px-2 py-0.5 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300">
            <AppIcon :name="ICONS.check" :size="12" /> Declarar SUNAT
          </span>
          <span v-if="cabecera.tiene_movimientos_inventario" class="inline-flex items-center gap-1 rounded-full bg-warning-100 px-2 py-0.5 text-warning-700 dark:bg-warning-500/10 dark:text-warning-300">
            <AppIcon :name="ICONS.alertTriangle" :size="12" /> Afectó inventario
          </span>
          <span v-else class="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-gray-600 dark:bg-white/5 dark:text-gray-400">
            Sin movimientos de inventario
          </span>
        </div>
      </DetailSectionCard>

      <DetailSectionCard title="Detalle" :icon="ICONS.clipboardList" :full-width="true">
        <div class="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
          <table class="min-w-full text-sm">
            <thead class="bg-gray-50 dark:bg-white/5">
              <tr>
                <th class="px-3 py-2 text-left">#</th>
                <th class="px-3 py-2 text-left">Producto</th>
                <th class="px-3 py-2 text-left">Almacén</th>
                <th class="px-3 py-2 text-right">Cant.</th>
                <th class="px-3 py-2 text-right">P. unit.</th>
                <th class="px-3 py-2 text-right">Importe</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="det in compraDetalle" :key="det.id" class="border-t border-gray-100 dark:border-gray-800">
                <td class="px-3 py-2 text-gray-500">{{ det.item }}</td>
                <td class="px-3 py-2">
                  <p class="font-medium text-gray-800 dark:text-white/90">
                    {{ det.nombre_producto ?? det.descripcion }}
                  </p>
                  <p v-if="det.codigo_producto" class="text-xs text-gray-400">Código: {{ det.codigo_producto }}</p>
                  <p v-if="det.unidad_medida" class="text-xs text-gray-400">{{ det.unidad_medida }}</p>
                </td>
                <td class="px-3 py-2 text-gray-600 dark:text-gray-400">{{ det.almacen ?? '—' }}</td>
                <td class="px-3 py-2 text-right tabular-nums">{{ det.cantidad }}</td>
                <td class="px-3 py-2 text-right tabular-nums">{{ det.precio_unitario != null ? formatMoney(det.precio_unitario) : '—' }}</td>
                <td class="px-3 py-2 text-right tabular-nums font-medium">{{ formatMoney(det.importe) }}</td>
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
import AppIcon from '@/shared/components/AppIcon.vue'
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
const cabecera = computed(() => compra.value?.cabecera ?? null)
const compraDetalle = computed(() => compra.value?.detalle ?? [])

const compraLabel = computed(() => {
  if (!cabecera.value) return undefined
  return `${cabecera.value.serie ?? '—'}-${cabecera.value.numero ?? '—'}`
})

function formatMoney(value: number) {
  return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(value)
}
</script>
