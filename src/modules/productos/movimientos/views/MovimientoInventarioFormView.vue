<template>
  <div>
    <PageBreadcrumb :page-title="pageTitle" :items="breadcrumbItems" />

    <div class="mb-5 flex flex-wrap items-center gap-2">
      <RouterLink
        :to="backTo"
        class="inline-flex items-center gap-1 text-sm font-medium text-gray-500 transition hover:text-gray-800 dark:text-gray-400 dark:hover:text-white/90"
      >
        <AppIcon :name="ICONS.chevronLeft" :size="16" />
        {{ backLabel }}
      </RouterLink>
      <AppHelpTip :text="pageHelpText" />
    </div>

    <MovimientoInventarioForm
      :mode="mode"
      :movimiento-id="movimientoId"
      :initial-id-producto="initialIdProducto"
      :initial-id-almacen="initialIdAlmacen"
      :initial-tipo-nombre="initialTipoNombre"
      :active="true"
      @saved="goBack"
      @cancel="goBack"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import PageBreadcrumb from '@/modules/admin/components/PageBreadcrumb.vue'
import MovimientoInventarioForm from '@/modules/productos/movimientos/components/MovimientoInventarioForm.vue'
import type { MovimientoInventarioFormMode } from '@/modules/productos/movimientos/interfaces/movimiento-inventario.interface'
import { productosMovimientosBreadcrumbItems } from '@/modules/productos/config/productos-breadcrumb'
import AppIcon from '@/shared/components/AppIcon.vue'
import { AppHelpTip } from '@/shared/components'
import { parsePositiveIntQuery } from '@/shared/composables/useOpenIdFromRouteQuery'
import { ICONS } from '@/shared/constants/icons'

type TipoMovimientoManual = 'AJUSTE' | 'TRASLADO'

const route = useRoute()
const router = useRouter()

const mode = computed<MovimientoInventarioFormMode>(() =>
  route.name === 'admin-productos-movimientos-editar' ? 'edit' : 'create',
)

const movimientoId = computed(() => {
  const raw = Number(route.params.id)
  return Number.isFinite(raw) && raw > 0 ? raw : null
})

const initialIdProducto = computed(() => parsePositiveIntQuery(route.query.idProducto))
const initialIdAlmacen = computed(() => parsePositiveIntQuery(route.query.idAlmacen))

const initialTipoNombre = computed<TipoMovimientoManual | null>(() => {
  const raw = String(route.query.tipo ?? '')
    .trim()
    .toUpperCase()
  if (raw === 'AJUSTE' || raw === 'TRASLADO') return raw
  return null
})

const pageTitle = computed(() => {
  if (mode.value === 'edit') return 'Editar movimiento'
  if (initialTipoNombre.value === 'AJUSTE') return 'Ajuste de stock'
  if (initialTipoNombre.value === 'TRASLADO') return 'Traslado entre almacenes'
  return 'Nuevo movimiento'
})

const pageHelpText = computed(() =>
  mode.value === 'edit'
    ? 'Solo puedes modificar fecha, documento de referencia y glosa.'
    : 'Ajuste o traslado de stock. Los ingresos se registran en Compras y las salidas en Ventas.',
)

const breadcrumbItems = computed(() => productosMovimientosBreadcrumbItems(pageTitle.value))

const fromStockWithTipo = computed(
  () => mode.value === 'create' && initialTipoNombre.value != null,
)

const backTo = computed(() =>
  fromStockWithTipo.value
    ? { name: 'admin-productos-stock' as const }
    : { name: 'admin-productos-movimientos' as const },
)

const backLabel = computed(() =>
  fromStockWithTipo.value ? 'Volver a Stock' : 'Volver al listado',
)

const goBack = () => {
  void router.push(backTo.value)
}
</script>
