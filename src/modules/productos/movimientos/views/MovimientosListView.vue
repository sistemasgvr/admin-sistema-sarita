<template>
  <div>
    <PageBreadcrumb
      page-title="Historial de movimientos"
      :items="breadcrumbItems"
      help="Consulta ajustes y traslados. Los ingresos entran por Compras y las salidas por Ventas. Para registrar un ajuste o traslado usa Stock."
    />

    <AppSummaryCards :cards="resumenCards" />

    <div
      v-if="activeFilterChips.length"
      class="mb-4 flex flex-wrap items-center gap-2"
    >
      <span class="text-theme-xs font-medium text-gray-500 dark:text-gray-400">
        Filtros activos
      </span>
      <button
        v-for="chip in activeFilterChips"
        :key="chip.key"
        type="button"
        class="inline-flex items-center gap-1.5 rounded-lg border border-brand-200 bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700 transition hover:bg-brand-100 dark:border-brand-500/30 dark:bg-brand-500/10 dark:text-brand-200 dark:hover:bg-brand-500/20"
        :title="`Quitar filtro ${chip.label}`"
        @click="clearFilterChip(chip.key)"
      >
        <span>{{ chip.label }}: {{ chip.value }}</span>
        <AppIcon :name="ICONS.x" :size="12" />
      </button>
      <button
        type="button"
        class="inline-flex items-center gap-1 text-xs font-medium text-gray-500 transition hover:text-brand-600 dark:text-gray-400 dark:hover:text-brand-400"
        @click="clearAllScopedFilters"
      >
        <AppIcon :name="ICONS.brushCleaning" :size="14" />
        Limpiar filtros
      </button>
    </div>

    <AppTable
      :columns="columns"
      :rows="rows"
      row-key="id"
      :loading="isLoading"
    >
      <template #toolbar>
        <AppListToolbar
          v-model:search="buscar"
          v-model:filters="dynamicFilters"
          :filter-fields="filterFields"
          search-placeholder="Producto, almacén o glosa..."
          @filter-change="onFiltersChange"
        >
          <template #actions>
            <AppExportExcelButton :on-export="exportarExcel" />
            <RouterLink
              v-if="canCreate"
              :to="{ name: 'admin-productos-movimientos-nuevo', query: { tipo: 'AJUSTE' } }"
              class="inline-flex h-11 min-w-11 shrink-0 items-center justify-center gap-2 rounded-lg bg-brand-500 px-3 text-sm font-medium text-white shadow-theme-xs transition hover:bg-brand-600 sm:px-4"
              title="Ajuste"
            >
              <AppIcon :name="ICONS.plus" :size="18" />
              <span class="hidden sm:inline">Ajuste</span>
            </RouterLink>
            <RouterLink
              v-if="canCreate"
              :to="{ name: 'admin-productos-movimientos-nuevo', query: { tipo: 'TRASLADO' } }"
              class="inline-flex h-11 min-w-11 shrink-0 items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-3 text-sm font-medium text-gray-700 shadow-theme-xs transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-white/[0.03] sm:px-4"
              title="Traslado"
            >
              <AppIcon :name="ICONS.arrowLeftRight" :size="18" />
              <span class="hidden sm:inline">Traslado</span>
            </RouterLink>
            <RouterLink
              :to="{ name: 'admin-productos-stock' }"
              class="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-3 text-sm font-medium text-gray-700 shadow-theme-xs transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-white/[0.03] sm:px-4"
            >
              Ir a Stock
            </RouterLink>
          </template>
        </AppListToolbar>
      </template>

      <template #cell-fecha="{ value }">
        {{ formatFecha(value as string) }}
      </template>

      <template #cell-producto="{ row }">
        <div>
          <p class="font-medium text-gray-800 dark:text-white/90">
            {{ row.nombre_producto }}
          </p>
          <p class="text-theme-xs text-gray-500 dark:text-gray-400">
            {{ row.codigo_producto }}
          </p>
        </div>
      </template>

      <template #cell-nombre_tipo_movimiento="{ value }">
        <ListaOpcionBadge :value="value as string" />
      </template>

      <template #cell-cantidad="{ value, row }">
        <span class="tabular-nums font-medium">
          {{ formatCantidad(value, row.nombre_unidad_medida, row.es_gas) }}
        </span>
      </template>

      <template #cell-stock="{ row }">
        <div
          v-if="row.stock_anterior != null && row.stock_nuevo != null"
          class="flex flex-col gap-1"
        >
          <div class="flex items-center gap-1.5">
            <AppBadge size="sm" variant="light" color="neutral" title="Stock anterior">
              SA
            </AppBadge>
            <span class="tabular-nums text-theme-xs text-gray-600 dark:text-gray-400">
              {{ formatCantidad(row.stock_anterior, row.nombre_unidad_medida, row.es_gas) }}
            </span>
          </div>
          <div class="flex items-center gap-1.5">
            <AppBadge size="sm" variant="light" color="primary" title="Stock nuevo">
              SN
            </AppBadge>
            <span class="tabular-nums text-theme-xs text-gray-800 dark:text-white/90">
              {{ formatCantidad(row.stock_nuevo, row.nombre_unidad_medida, row.es_gas) }}
            </span>
          </div>
        </div>
        <span v-else class="text-gray-400">—</span>
      </template>

      <template #actions="{ row }">
        <div class="inline-flex items-center justify-end gap-1.5">
          <button
            v-if="canView"
            type="button"
            title="Ver detalle"
            class="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-300 text-gray-600 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
            @click="openDetailModal(row)"
          >
            <AppIcon :name="ICONS.eye" :size="15" />
          </button>

          <AppActionMenu
            :items="actionItemsForRow(row)"
            :execute="(key) => onActionSelect(key, row)"
          />
        </div>
      </template>

      <template #footer>
        <AppPagination
          v-model:pagina="pagina"
          v-model:limite="limite"
          :meta="movimientosQuery.data.value?.meta"
          :disabled="isLoading"
        />
      </template>
    </AppTable>

    <MovimientoInventarioDetailModal
      v-model="detailModalOpen"
      :movimiento="movimientoToView"
    />

    <AppModal
      v-model="deleteModalOpen"
      title="Anular movimiento"
      :subtitle="
        anularBlocked
          ? 'No se puede anular este movimiento.'
          : 'Se revertirá el efecto en stock si el producto afecta inventario.'
      "
      size="sm"
    >
      <div
        v-if="anularBlocked"
        class="rounded-lg border border-error-200 bg-error-50 px-3 py-2.5 text-sm text-error-700 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-300"
      >
        <template v-if="movimientoToDelete?.id_documento_ref">
          Este movimiento está vinculado a una venta/comprobante. Debe anularse o
          corregirse desde Comprobantes, no desde inventario.
        </template>
        <template v-else>
          {{
            movimientoToDelete?.motivo_bloqueo_anulacion ||
            'No está permitido anular este movimiento.'
          }}
        </template>
      </div>

      <p v-else class="text-sm text-gray-600 dark:text-gray-400">
        ¿Confirmas que deseas anular el movimiento de
        <span class="font-medium text-gray-800 dark:text-white/90">
          {{ movimientoToDelete?.nombre_tipo_movimiento }}
        </span>
        del
        <span class="font-medium text-gray-800 dark:text-white/90">
          {{ formatFecha(movimientoToDelete?.fecha) }}
        </span>
        ?
      </p>

      <template #footer>
        <button
          type="button"
          class="flex w-full justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-white/[0.03] sm:w-auto"
          :disabled="deleteMutation.isPending.value"
          @click="deleteModalOpen = false"
        >
          {{ anularBlocked ? 'Cerrar' : 'Cancelar' }}
        </button>
        <button
          v-if="!anularBlocked"
          type="button"
          class="flex w-full justify-center rounded-lg bg-error-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-error-600 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
          :disabled="deleteMutation.isPending.value"
          @click="confirmDelete"
        >
          {{ deleteMutation.isPending.value ? 'Anulando...' : 'Anular' }}
        </button>
      </template>
    </AppModal>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import PageBreadcrumb from '@/modules/admin/components/PageBreadcrumb.vue'
import { useListaOpcionesQuery } from '@/modules/catalogos/composables/useListaOpcionesQuery'
import { toSelectOptions } from '@/modules/catalogos/utils/toSelectOptions'
import { almacenesService } from '@/modules/configuracion/almacenes/services/almacenes.service'
import type { Almacen } from '@/modules/configuracion/almacenes/interfaces/almacen.interface'
import { productosService } from '@/modules/productos/articulos/services/productos.service'
import MovimientoInventarioDetailModal from '@/modules/productos/movimientos/components/MovimientoInventarioDetailModal.vue'
import { useDeleteMovimientoInventarioMutation } from '@/modules/productos/movimientos/composables/useMovimientoInventarioMutations'
import { useMovimientosInventarioQuery } from '@/modules/productos/movimientos/composables/useMovimientosInventarioQuery'
import { exportarMovimientosExcel } from '@/modules/productos/movimientos/utils/exportarMovimientosExcel'
import { productosBreadcrumbItems } from '@/modules/productos/config/productos-breadcrumb'
import type {
  MovimientoInventario,
  MovimientoInventarioListFilters,
} from '@/modules/productos/movimientos/interfaces/movimiento-inventario.interface'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import {
  AppActionMenu,
  AppBadge,
  AppExportExcelButton,
  AppListToolbar,
  AppModal,
  AppPagination,
  AppSummaryCards,
  AppTable,
  ListaOpcionBadge,
} from '@/shared/components'
import AppIcon from '@/shared/components/AppIcon.vue'
import type { SummaryCardItem } from '@/shared/components/ui/AppSummaryCards.vue'
import { parsePositiveIntQuery } from '@/shared/composables/useOpenIdFromRouteQuery'
import { ICONS } from '@/shared/constants/icons'
import { ListaIds } from '@/shared/constants/lista-ids'
import { formatListaOpcionLabel } from '@/shared/utils/formatListaOpcion'
import { PermisoBanderas } from '@/shared/constants/permissions'
import { formatCantidadPorUnidad } from '@/shared/utils/unidadMedidaCantidad'
import type { ActionMenuItem } from '@/shared/interfaces/action-menu.interface'
import type { DynamicFilterFieldDef, DynamicFilterValues } from '@/shared/interfaces/dynamic-filter.interface'
import type { TableColumn } from '@/shared/interfaces/table.interface'

const authStore = useAuthStore()
const route = useRoute()
const router = useRouter()
const breadcrumbItems = productosBreadcrumbItems('Movimientos (accesorios)')
const idProductoFiltro = ref<number | null>(null)
const nombreProductoFiltro = ref<string | null>(null)

const listaTipoMovId = ref(ListaIds.TIPO_MOV_INV)
const tiposMovimientoQuery = useListaOpcionesQuery(listaTipoMovId)

const almacenes = ref<Almacen[]>([])
const isLoadingCatalogos = ref(false)

const dynamicFilters = ref<DynamicFilterValues>({})
const buscar = ref('')
const pagina = ref(1)
const limite = ref(10)

type FilterChipKey = 'producto' | 'almacen' | 'tipo' | 'fechaDesde' | 'fechaHasta'

const activeFilterChips = computed(() => {
  const chips: { key: FilterChipKey; label: string; value: string }[] = []

  if (idProductoFiltro.value) {
    chips.push({
      key: 'producto',
      label: 'Producto',
      value: nombreProductoFiltro.value || `#${idProductoFiltro.value}`,
    })
  }

  const idAlmacen = dynamicFilters.value.idAlmacen
  if (idAlmacen != null && idAlmacen !== '') {
    const almacen = almacenes.value.find((a) => a.id === Number(idAlmacen))
    chips.push({
      key: 'almacen',
      label: 'Almacén',
      value: almacen?.nombre || `#${idAlmacen}`,
    })
  }

  const idTipo = dynamicFilters.value.idTipoMovimiento
  if (idTipo != null && idTipo !== '') {
    const tipo = tiposMovimientoQuery.data.value?.find((t) => t.id === Number(idTipo))
    chips.push({
      key: 'tipo',
      label: 'Tipo',
      value: formatListaOpcionLabel(tipo?.nombre) || `#${idTipo}`,
    })
  }

  if (dynamicFilters.value.fechaDesde) {
    chips.push({
      key: 'fechaDesde',
      label: 'Desde',
      value: String(dynamicFilters.value.fechaDesde),
    })
  }

  if (dynamicFilters.value.fechaHasta) {
    chips.push({
      key: 'fechaHasta',
      label: 'Hasta',
      value: String(dynamicFilters.value.fechaHasta),
    })
  }

  return chips
})

const filters = ref<MovimientoInventarioListFilters>({
  buscar: '',
  pagina: 1,
  limite: 10,
})

const movimientosQuery = useMovimientosInventarioQuery(filters)
const deleteMutation = useDeleteMovimientoInventarioMutation()

const deleteModalOpen = ref(false)
const movimientoToDelete = ref<MovimientoInventario | null>(null)
const anularBlocked = computed(() => movimientoToDelete.value?.puede_anular === false)

const detailModalOpen = ref(false)
const movimientoToView = ref<MovimientoInventario | null>(null)

const canCreate = computed(() => authStore.hasPermission(PermisoBanderas.MOVIMIENTOS_CREAR))
const canView = computed(() => authStore.hasPermission(PermisoBanderas.MOVIMIENTOS_VER))
const canEdit = computed(() => authStore.hasPermission(PermisoBanderas.MOVIMIENTOS_EDITAR))
const canDelete = computed(() => authStore.hasPermission(PermisoBanderas.MOVIMIENTOS_ELIMINAR))

const isLoading = computed(() => movimientosQuery.isFetching.value)
const rows = computed(() => movimientosQuery.data.value?.data ?? [])

const resumen = computed(
  () =>
    (movimientosQuery.data.value?.meta?.resumen ?? {}) as Record<string, number>,
)

const resumenCards = computed<SummaryCardItem[]>(() => [
  {
    key: 'total',
    label: 'Total movimientos',
    value: String(resumen.value.total ?? 0),
    icon: ICONS.arrowLeftRight,
    iconClass: 'bg-brand-100 text-brand-600 dark:bg-brand-500/20 dark:text-brand-300',
  },
  {
    key: 'ingresos',
    label: 'Ingresos',
    value: String(resumen.value.ingresos ?? 0),
    icon: ICONS.arrowDownToLine,
    iconClass: 'bg-success-100 text-success-700 dark:bg-success-500/20 dark:text-success-300',
  },
  {
    key: 'salidas',
    label: 'Salidas',
    value: String(resumen.value.salidas ?? 0),
    icon: ICONS.arrowUpFromLine,
    iconClass: 'bg-error-100 text-error-600 dark:bg-error-500/20 dark:text-error-300',
  },
  {
    key: 'ajustes',
    label: 'Ajustes',
    value: String(resumen.value.ajustes ?? 0),
    icon: ICONS.refreshCw,
    iconClass: 'bg-warning-100 text-warning-700 dark:bg-warning-500/20 dark:text-warning-300',
  },
])

const filterFields = computed<DynamicFilterFieldDef[]>(() => [
  {
    key: 'fechaDesde',
    label: 'Desde',
    type: 'date',
  },
  {
    key: 'fechaHasta',
    label: 'Hasta',
    type: 'date',
  },
  {
    key: 'idAlmacen',
    label: 'Almacén',
    type: 'select',
    placeholder: 'Seleccionar almacén',
    disabled: isLoadingCatalogos.value,
    options: almacenes.value.map((almacen) => ({
      value: almacen.id,
      label: almacen.nombre,
    })),
  },
  {
    key: 'idTipoMovimiento',
    label: 'Tipo',
    type: 'select',
    placeholder: 'Seleccionar tipo',
    disabled: tiposMovimientoQuery.isFetching.value,
    options: toSelectOptions(tiposMovimientoQuery.data.value),
  },
])

const columns = computed<TableColumn<MovimientoInventario>[]>(() => [
  { key: 'fecha', label: 'Fecha' },
  { key: 'producto', label: 'Producto' },
  { key: 'nombre_almacen', label: 'Almacén' },
  { key: 'nombre_tipo_movimiento', label: 'Tipo' },
  { key: 'cantidad', label: 'Cantidad' },
  { key: 'stock', label: 'Stock' },
  { key: 'glosa', label: 'Glosa' },
])

let buscarTimeout: ReturnType<typeof setTimeout> | undefined

const formatCantidad = (
  value: unknown,
  nombreUnidad?: string | null,
  esGas?: boolean | null,
) => formatCantidadPorUnidad(value, nombreUnidad, esGas)

const formatFecha = (value?: string | null) => {
  if (!value) return '—'
  const date = new Date(`${value.slice(0, 10)}T12:00:00`)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('es-PE', { dateStyle: 'medium' }).format(date)
}

const exportarExcel = () => exportarMovimientosExcel(filters.value)

const loadCatalogos = async () => {
  isLoadingCatalogos.value = true
  try {
    const almacenesResponse = await almacenesService.listar({ pagina: 1, limite: 100 })
    almacenes.value = almacenesResponse.data
  } catch {
    almacenes.value = []
  } finally {
    isLoadingCatalogos.value = false
  }
}

const loadProductoFiltroLabel = async (idProducto: number | null) => {
  if (!idProducto) {
    nombreProductoFiltro.value = null
    return
  }
  try {
    const producto = await productosService.obtenerPorId(idProducto)
    nombreProductoFiltro.value = producto.nombre || producto.codigo || `#${idProducto}`
  } catch {
    nombreProductoFiltro.value = `#${idProducto}`
  }
}

const syncRouteQuery = () => {
  const nextQuery: Record<string, string> = {}
  if (idProductoFiltro.value) nextQuery.idProducto = String(idProductoFiltro.value)
  const idAlmacen = dynamicFilters.value.idAlmacen
  if (idAlmacen != null && idAlmacen !== '') {
    nextQuery.idAlmacen = String(idAlmacen)
  }

  const currProducto = typeof route.query.idProducto === 'string' ? route.query.idProducto : undefined
  const currAlmacen = typeof route.query.idAlmacen === 'string' ? route.query.idAlmacen : undefined
  if (currProducto === nextQuery.idProducto && currAlmacen === nextQuery.idAlmacen) {
    return
  }

  void router.replace({ query: nextQuery })
}

const applyQueryFilters = async () => {
  const idProductoQuery = parsePositiveIntQuery(route.query.idProducto)
  const idAlmacenQuery = parsePositiveIntQuery(route.query.idAlmacen)

  if (idProductoFiltro.value !== idProductoQuery) {
    idProductoFiltro.value = idProductoQuery
    await loadProductoFiltroLabel(idProductoQuery)
  }

  const currentAlmacen =
    dynamicFilters.value.idAlmacen != null && dynamicFilters.value.idAlmacen !== ''
      ? Number(dynamicFilters.value.idAlmacen)
      : null

  if (idAlmacenQuery && currentAlmacen !== idAlmacenQuery) {
    dynamicFilters.value = { ...dynamicFilters.value, idAlmacen: idAlmacenQuery }
  } else if (!idAlmacenQuery && currentAlmacen != null) {
    const { idAlmacen: _removed, ...rest } = dynamicFilters.value
    dynamicFilters.value = rest
  }

  pagina.value = 1
  syncFilters()
}

onMounted(() => {
  loadCatalogos()
  void applyQueryFilters()
})

watch(
  () => [route.query.idProducto, route.query.idAlmacen] as const,
  () => {
    void applyQueryFilters()
  },
)

const syncFilters = () => {
  const active = dynamicFilters.value

  filters.value = {
    buscar: buscar.value.trim(),
    pagina: pagina.value,
    limite: limite.value,
    idProducto: idProductoFiltro.value ?? undefined,
    fechaDesde: active.fechaDesde ? String(active.fechaDesde) : undefined,
    fechaHasta: active.fechaHasta ? String(active.fechaHasta) : undefined,
    idAlmacen:
      active.idAlmacen != null && active.idAlmacen !== ''
        ? Number(active.idAlmacen)
        : undefined,
    idTipoMovimiento:
      active.idTipoMovimiento != null && active.idTipoMovimiento !== ''
        ? Number(active.idTipoMovimiento)
        : undefined,
  }
}

const onFiltersChange = () => {
  pagina.value = 1
  syncFilters()
  syncRouteQuery()
}

const clearFilterChip = (key: FilterChipKey) => {
  switch (key) {
    case 'producto':
      idProductoFiltro.value = null
      nombreProductoFiltro.value = null
      break
    case 'almacen': {
      const { idAlmacen: _removed, ...rest } = dynamicFilters.value
      dynamicFilters.value = rest
      break
    }
    case 'tipo': {
      const { idTipoMovimiento: _removed, ...rest } = dynamicFilters.value
      dynamicFilters.value = rest
      break
    }
    case 'fechaDesde': {
      const { fechaDesde: _removed, ...rest } = dynamicFilters.value
      dynamicFilters.value = rest
      break
    }
    case 'fechaHasta': {
      const { fechaHasta: _removed, ...rest } = dynamicFilters.value
      dynamicFilters.value = rest
      break
    }
  }
  pagina.value = 1
  syncFilters()
  syncRouteQuery()
}

const clearAllScopedFilters = () => {
  idProductoFiltro.value = null
  nombreProductoFiltro.value = null
  dynamicFilters.value = {}
  pagina.value = 1
  syncFilters()
  syncRouteQuery()
}

watch(buscar, () => {
  clearTimeout(buscarTimeout)
  buscarTimeout = setTimeout(() => {
    pagina.value = 1
    syncFilters()
  }, 350)
})

watch([pagina, limite], () => {
  syncFilters()
})

const openEdit = (movimiento: MovimientoInventario) => {
  void router.push({
    name: 'admin-productos-movimientos-editar',
    params: { id: String(movimiento.id) },
  })
}

const openDetailModal = (movimiento: MovimientoInventario) => {
  movimientoToView.value = movimiento
  detailModalOpen.value = true
}

const openDeleteModal = (movimiento: MovimientoInventario) => {
  movimientoToDelete.value = movimiento
  deleteModalOpen.value = true
}

const confirmDelete = async () => {
  if (!movimientoToDelete.value) return

  try {
    await deleteMutation.mutateAsync(movimientoToDelete.value.id)
    deleteModalOpen.value = false
    movimientoToDelete.value = null
  } catch {
    // toast en mutation
  }
}

function anularLabelForRow(row: MovimientoInventario): string {
  if (row.puede_anular !== false) return 'Anular'
  if (row.motivo_bloqueo_anulacion) {
    return `Anular (${row.motivo_bloqueo_anulacion})`
  }
  return 'Anular (no permitido)'
}

function actionItemsForRow(row: MovimientoInventario): ActionMenuItem[] {
  const busy = deleteMutation.isPending.value
  const blocked = row.puede_anular === false
  const linkedToSale = row.id_documento_ref != null

  return [
    {
      key: 'edit',
      label: linkedToSale ? 'Editar (vinculado a venta)' : 'Editar',
      icon: ICONS.pencil,
      disabled: busy || linkedToSale,
      hidden: !canEdit.value,
    },
    {
      key: 'delete',
      label: anularLabelForRow(row),
      icon: ICONS.trash,
      danger: !blocked,
      disabled: busy || blocked,
      hidden: !canDelete.value,
    },
  ]
}

function onActionSelect(key: string, row: MovimientoInventario) {
  switch (key) {
    case 'edit':
      openEdit(row)
      return
    case 'delete':
      openDeleteModal(row)
      return
  }
}
</script>
