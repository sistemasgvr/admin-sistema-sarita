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
            <AppBadge class="mt-0.5" :color="cabecera.estado === 1 ? 'success' : 'error'">
              {{ cabecera.estado === 1 ? 'Activo' : 'Anulado' }}
            </AppBadge>
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

        <div class="mt-3 flex flex-wrap items-center gap-2">
          <AppBadge v-if="cabecera.declarar_sunat" color="primary" :icon="ICONS.check">
            Declarar SUNAT
          </AppBadge>
          <AppBadge v-if="cabecera.tiene_movimientos_inventario" color="warning" :icon="ICONS.alertTriangle">
            Afectó inventario
          </AppBadge>
          <AppBadge v-else color="neutral">
            Sin movimientos de inventario
          </AppBadge>
        </div>
      </DetailSectionCard>

      <RecargaPlantaBalonesCard
        :id-recarga-planta="cabecera.id_recarga_planta"
        :numero="cabecera.numero_recarga_planta"
      />

      <DetailSectionCard title="Detalle" :icon="ICONS.clipboardList" :full-width="true">
        <div class="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
          <table class="min-w-full text-sm">
            <thead class="bg-gray-50 dark:bg-white/5">
              <tr>
                <th class="px-3 py-2 text-left">#</th>
                <th class="px-3 py-2 text-left">Producto</th>
                <th class="px-3 py-2 text-left">Almacén</th>
                <th class="px-3 py-2 text-right">Cant.</th>
                <th class="px-3 py-2 text-right">P. unit. (IGV inc.)</th>
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
import RecargaPlantaBalonesCard from '@/modules/compras/components/RecargaPlantaBalonesCard.vue'
import DetailSectionCard from '@/shared/components/detail/DetailSectionCard.vue'
import { AppBadge, AppModal } from '@/shared/components'
import { ICONS } from '@/shared/constants/icons'

const props = defineProps<{
  compraId: number | null
}>()

const open = defineModel<boolean>({ default: false })

const compraId = computed(() => (open.value ? props.compraId : null))
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
