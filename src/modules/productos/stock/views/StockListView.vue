<template>
  <div>
    <PageBreadcrumb
      page-title="Stock"
      :items="breadcrumbItems"
      help="Saldo actual por almacén. Ajusta o traslada desde aquí. Los ingresos entran por Compras y las salidas por Ventas."
    />

    <AppSummaryCards :cards="resumenCards" />

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
          search-placeholder="Almacén, código o producto..."
          @filter-change="onFiltersChange"
        >
          <template #search-extra>
            <ProductoBarcodeScanButton
              title="Escanear producto"
              :filters="{
                soloActivos: 1,
                afectaStock: true,
                esGas: false,
                esServicio: false,
              }"
              @scanned="onProductoScanned"
            />
          </template>

          <template #actions>
            <AppExportExcelButton :on-export="exportarExcel" />
            <div class="min-w-[9.5rem] flex-1 sm:w-40 sm:flex-none">
              <AppSelect v-model="mostrarEstado" :options="estadoFiltroOptions" />
            </div>
            <RouterLink
              v-if="canCreateMovimiento"
              :to="{ name: 'admin-inventario-movimientos', query: { tipo: 'AJUSTE' } }"
              class="inline-flex h-11 min-w-11 shrink-0 items-center justify-center gap-2 rounded-lg bg-brand-500 px-3 text-sm font-medium text-white shadow-theme-xs transition hover:bg-brand-600 sm:px-4"
              title="Ajuste"
            >
              <AppIcon :name="ICONS.pencil" :size="18" />
              <span class="hidden sm:inline">Ajuste</span>
            </RouterLink>
            <RouterLink
              v-if="canCreateMovimiento"
              :to="{ name: 'admin-inventario-movimientos', query: { tipo: 'TRASLADO' } }"
              class="inline-flex h-11 min-w-11 shrink-0 items-center justify-center gap-2 rounded-lg bg-brand-500 px-3 text-sm font-medium text-white shadow-theme-xs transition hover:bg-brand-600 sm:px-4"
              title="Traslado"
            >
              <AppIcon :name="ICONS.arrowLeftRight" :size="18" />
              <span class="hidden sm:inline">Traslado</span>
            </RouterLink>
            <RouterLink
              v-if="canListMovimientos"
              :to="{ name: 'admin-inventario-movimientos' }"
              class="inline-flex h-11 min-w-11 shrink-0 items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-3 text-sm font-medium text-gray-700 shadow-theme-xs transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-white/[0.03] sm:px-4"
              title="Historial"
            >
              <AppIcon :name="ICONS.history" :size="18" />
              <span class="hidden sm:inline">Historial</span>
            </RouterLink>
          </template>
        </AppListToolbar>
      </template>

      <template #cell-almacen="{ row }">
        <div>
          <p class="font-medium text-gray-800 dark:text-white/90">
            {{ row.nombre_almacen }}
          </p>
          <p v-if="row.nombre_sucursal" class="text-theme-xs text-gray-500 dark:text-gray-400">
            {{ row.nombre_sucursal }}
          </p>
        </div>
      </template>

      <template #cell-producto="{ row }">
        <div class="min-w-0">
          <p class="font-medium text-gray-800 dark:text-white/90">
            {{ row.nombre_producto }}
          </p>
          <p class="text-theme-xs text-gray-500 dark:text-gray-400">
            {{ row.codigo_producto }}
          </p>
          <div
            v-if="row.nombre_categoria || row.nombre_sub_categoria"
            class="mt-1.5 flex flex-wrap items-center gap-1"
          >
            <AppBadge
              v-if="row.nombre_categoria"
              size="sm"
              variant="light"
              color="neutral"
            >
              {{ row.nombre_categoria }}
            </AppBadge>
            <AppBadge
              v-if="row.nombre_sub_categoria"
              size="sm"
              variant="light"
              color="primary"
            >
              {{ row.nombre_sub_categoria }}
            </AppBadge>
          </div>
        </div>
      </template>

      <template #cell-stock="{ value, row }">
        <span
          class="tabular-nums font-medium"
          :class="
            row.bajo_minimo
              ? 'text-error-600 dark:text-error-400'
              : 'text-gray-800 dark:text-white/90'
          "
        >
          {{ formatCantidad(value, row.nombre_unidad_medida) }}
        </span>
      </template>

      <template #cell-stock_minimo="{ value, row }">
        <span class="tabular-nums text-gray-600 dark:text-gray-400">
          {{ formatCantidad(value, row.nombre_unidad_medida) }}
        </span>
      </template>

      <template #cell-bajo_minimo="{ value }">
        <AppBadge
          v-if="value"
          variant="light"
          color="error"
        >
          Bajo mínimo
        </AppBadge>
        <AppBadge v-else variant="light" color="success">
          OK
        </AppBadge>
      </template>

      <template #actions="{ row }">
        <div class="inline-flex items-center justify-end gap-1.5">
          <button
            v-if="canView"
            type="button"
            title="Ver detalle"
            class="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-300 text-gray-600 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
            @click="openDetail(row)"
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
          :meta="stockQuery.data.value?.meta"
          :disabled="isLoading"
        />
      </template>
    </AppTable>

    <StockFormModal
      v-model="formModalOpen"
      :stock="selectedStock"
      @saved="onStockSaved"
    />

    <AppModal
      v-model="deleteModalOpen"
      title="Eliminar registro de stock"
      :subtitle="
        deleteBlockedByCantidad
          ? 'Este registro tiene cantidad distinta de cero.'
          : 'Solo se puede eliminar si la cantidad es cero.'
      "
      size="sm"
    >
      <div
        v-if="deleteBlockedByCantidad"
        class="rounded-lg border border-error-200 bg-error-50 px-3 py-2.5 text-sm text-error-700 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-300"
      >
        No puedes eliminar el stock de
        <span class="font-medium">{{ stockToDelete?.nombre_producto }}</span>
        en
        <span class="font-medium">{{ stockToDelete?.nombre_almacen }}</span>
        porque la cantidad debe ser cero. Registra un ajuste hasta dejarlo en cero e
        inténtalo de nuevo.
      </div>

      <p v-else class="text-sm text-gray-600 dark:text-gray-400">
        ¿Confirmas que deseas eliminar el stock de
        <span class="font-medium text-gray-800 dark:text-white/90">
          {{ stockToDelete?.nombre_producto }}
        </span>
        en
        <span class="font-medium text-gray-800 dark:text-white/90">
          {{ stockToDelete?.nombre_almacen }}
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
          {{ deleteBlockedByCantidad ? 'Cerrar' : 'Cancelar' }}
        </button>
        <button
          v-if="!deleteBlockedByCantidad"
          type="button"
          class="flex w-full justify-center rounded-lg bg-error-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-error-600 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
          :disabled="deleteMutation.isPending.value"
          @click="confirmDelete"
        >
          {{ deleteMutation.isPending.value ? 'Eliminando...' : 'Eliminar' }}
        </button>
      </template>
    </AppModal>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import PageBreadcrumb from '@/modules/admin/components/PageBreadcrumb.vue'
import { almacenesService } from '@/modules/configuracion/almacenes/services/almacenes.service'
import type { Almacen } from '@/modules/configuracion/almacenes/interfaces/almacen.interface'
import StockFormModal from '@/modules/productos/stock/components/StockFormModal.vue'
import ProductoBarcodeScanButton from '@/modules/productos/articulos/components/ProductoBarcodeScanButton.vue'
import type { Producto } from '@/modules/productos/articulos/interfaces/producto.interface'
import {
  useDeleteStockMutation,
  useRestaurarStockMutation,
} from '@/modules/productos/stock/composables/useStockMutations'
import { useStockQuery } from '@/modules/productos/stock/composables/useStockQuery'
import { productosBreadcrumbItems } from '@/modules/productos/config/productos-breadcrumb'
import { exportarStockExcel } from '@/modules/productos/stock/utils/exportarStockExcel'
import type {
  Stock,
  StockListFilters,
} from '@/modules/productos/stock/interfaces/stock.interface'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import {
  AppActionMenu,
  AppBadge,
  AppExportExcelButton,
  AppListToolbar,
  AppModal,
  AppPagination,
  AppSelect,
  AppSummaryCards,
  AppTable,
} from '@/shared/components'
import AppIcon from '@/shared/components/AppIcon.vue'
import type { SummaryCardItem } from '@/shared/components/ui/AppSummaryCards.vue'
import { parsePositiveIntQuery } from '@/shared/composables/useOpenIdFromRouteQuery'
import { toastSuccess } from '@/shared/composables/useToast'
import { ICONS } from '@/shared/constants/icons'
import { PermisoBanderas } from '@/shared/constants/permissions'
import { formatCantidadPorUnidad } from '@/shared/utils/unidadMedidaCantidad'
import type { ActionMenuItem } from '@/shared/interfaces/action-menu.interface'
import type { DynamicFilterFieldDef, DynamicFilterValues } from '@/shared/interfaces/dynamic-filter.interface'
import type { SelectOption } from '@/shared/interfaces/form.interface'
import type { TableColumn } from '@/shared/interfaces/table.interface'

type EstadoFiltro = 'activos' | 'inactivos' | 'todos'

const authStore = useAuthStore()
const route = useRoute()
const router = useRouter()
const breadcrumbItems = productosBreadcrumbItems('Stock accesorios')

const almacenes = ref<Almacen[]>([])
const isLoadingAlmacenes = ref(false)

const dynamicFilters = ref<DynamicFilterValues>({})
const buscar = ref('')
const pagina = ref(1)
const limite = ref(10)
const mostrarEstado = ref<EstadoFiltro>('activos')

const estadoFiltroOptions: SelectOption[] = [
  { label: 'Activos', value: 'activos' },
  { label: 'Inactivos', value: 'inactivos' },
  { label: 'Todos', value: 'todos' },
]

const buildSoloActivos = (value: EstadoFiltro): number | null => {
  switch (value) {
    case 'activos':
      return 1
    case 'inactivos':
      return 0
    case 'todos':
    default:
      return null
  }
}

const filters = ref<StockListFilters>({
  buscar: '',
  pagina: 1,
  limite: 10,
  soloActivos: 1,
})

const stockQuery = useStockQuery(filters)
const deleteMutation = useDeleteStockMutation()
const restaurarMutation = useRestaurarStockMutation()

const formModalOpen = ref(false)
const selectedStock = ref<Stock | null>(null)

const deleteModalOpen = ref(false)
const stockToDelete = ref<Stock | null>(null)
const deleteBlockedByCantidad = computed(
  () => Number(stockToDelete.value?.stock) !== 0,
)

const canView = computed(() => authStore.hasPermission(PermisoBanderas.STOCK_VER))
const canEdit = computed(() => authStore.hasPermission(PermisoBanderas.STOCK_EDITAR))
const canDelete = computed(() => authStore.hasPermission(PermisoBanderas.STOCK_ELIMINAR))
const canRestore = computed(() => authStore.hasPermission(PermisoBanderas.STOCK_RESTAURAR))
const canCreateMovimiento = computed(() =>
  authStore.hasPermission(PermisoBanderas.INVENTARIO_MOVIMIENTOS_CREAR),
)
const canListMovimientos = computed(() =>
  authStore.hasPermission(PermisoBanderas.INVENTARIO_MOVIMIENTOS_LISTAR),
)

const isLoading = computed(() => stockQuery.isFetching.value)
const rows = computed(() => stockQuery.data.value?.data ?? [])

const resumen = computed(
  () => (stockQuery.data.value?.meta?.resumen ?? {}) as Record<string, number>,
)

const resumenCards = computed<SummaryCardItem[]>(() => [
  {
    key: 'total',
    label: 'Ítems en stock',
    value: String(resumen.value.total_items ?? 0),
    icon: ICONS.boxes,
    iconClass: 'bg-brand-100 text-brand-600 dark:bg-brand-500/20 dark:text-brand-300',
  },
  {
    key: 'bajo',
    label: 'Bajo mínimo',
    value: String(resumen.value.bajo_minimo ?? 0),
    icon: ICONS.alertTriangle,
    iconClass: 'bg-error-100 text-error-600 dark:bg-error-500/20 dark:text-error-300',
  },
  {
    key: 'ok',
    label: 'Stock OK',
    value: String(resumen.value.ok ?? 0),
    icon: ICONS.check,
    iconClass: 'bg-success-100 text-success-700 dark:bg-success-500/20 dark:text-success-300',
  },
  {
    key: 'unidades',
    label: 'Unidades totales',
    value: Number(resumen.value.stock_total ?? 0).toLocaleString('es-PE', {
      maximumFractionDigits: 2,
    }),
    icon: ICONS.package,
    iconClass: 'bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-300',
  },
])

const filterFields = computed<DynamicFilterFieldDef[]>(() => [
  {
    key: 'idAlmacen',
    label: 'Almacén',
    type: 'select',
    placeholder: 'Seleccionar almacén',
    disabled: isLoadingAlmacenes.value,
    options: almacenes.value.map((almacen) => ({
      value: almacen.id,
      label: almacen.nombre_sucursal
        ? `${almacen.nombre} (${almacen.nombre_sucursal})`
        : almacen.nombre,
    })),
  },
  {
    key: 'soloBajoMinimo',
    label: 'Bajo mínimo',
    type: 'checkbox',
    placeholder: 'Solo bajo mínimo',
  },
])

const columns = computed<TableColumn<Stock>[]>(() => [
  { key: 'almacen', label: 'Almacén' },
  { key: 'producto', label: 'Producto' },
  { key: 'nombre_unidad_medida', label: 'U.M.' },
  { key: 'stock', label: 'Saldo' },
  { key: 'stock_minimo', label: 'Mínimo' },
  { key: 'bajo_minimo', label: 'Estado' },
])

let buscarTimeout: ReturnType<typeof setTimeout> | undefined

const formatCantidad = (value: unknown, nombreUnidad?: string | null) =>
  formatCantidadPorUnidad(value, nombreUnidad)

const exportarExcel = () => exportarStockExcel(filters.value)

function onProductoScanned(producto: Producto) {
  // El listado filtra por código/nombre de producto (no por codigo_barra en SQL)
  buscar.value = producto.codigo
  toastSuccess(`${producto.codigo} — ${producto.nombre}`)
}

const loadCatalogos = async () => {
  isLoadingAlmacenes.value = true
  try {
    const almacenesResponse = await almacenesService.listar({ pagina: 1, limite: 100 })
    almacenes.value = almacenesResponse.data
  } catch {
    almacenes.value = []
  } finally {
    isLoadingAlmacenes.value = false
  }
}

onMounted(() => {
  loadCatalogos()
  const idAlmacenQuery = parsePositiveIntQuery(route.query.idAlmacen)
  if (idAlmacenQuery) {
    dynamicFilters.value = { ...dynamicFilters.value, idAlmacen: idAlmacenQuery }
    syncFilters()
  }
})

const syncFilters = () => {
  const active = dynamicFilters.value

  filters.value = {
    buscar: buscar.value.trim(),
    pagina: pagina.value,
    limite: limite.value,
    idAlmacen: active.idAlmacen != null ? Number(active.idAlmacen) : undefined,
    soloBajoMinimo: active.soloBajoMinimo === true ? true : undefined,
    soloActivos: buildSoloActivos(mostrarEstado.value),
  }
}

const onFiltersChange = () => {
  pagina.value = 1
  syncFilters()
}

watch(buscar, () => {
  clearTimeout(buscarTimeout)
  buscarTimeout = setTimeout(() => {
    pagina.value = 1
    syncFilters()
  }, 350)
})

watch(mostrarEstado, () => {
  pagina.value = 1
  syncFilters()
})

watch([pagina, limite], () => {
  syncFilters()
})

const openMinimoModal = (stock: Stock) => {
  selectedStock.value = stock
  formModalOpen.value = true
}

const openDetail = (stock: Stock) => {
  void router.push({
    name: 'admin-productos-stock-detalle',
    params: { id: String(stock.id) },
  })
}

const openDeleteModal = (stock: Stock) => {
  stockToDelete.value = stock
  deleteModalOpen.value = true
}

const confirmDelete = async () => {
  if (!stockToDelete.value) return

  try {
    await deleteMutation.mutateAsync(stockToDelete.value.id)
    deleteModalOpen.value = false
    stockToDelete.value = null
  } catch {
    // toast en mutation
  }
}

const restaurarStock = async (stock: Stock) => {
  try {
    await restaurarMutation.mutateAsync(stock.id)
  } catch {
    // toast en mutation
  }
}

function actionItemsForRow(row: Stock): ActionMenuItem[] {
  const busy = deleteMutation.isPending.value || restaurarMutation.isPending.value
  const blockedByCantidad = Number(row.stock) !== 0
  const activo = row.estado === 1

  return [
    {
      key: 'detalle',
      label: 'Ver detalle',
      icon: ICONS.eye,
      disabled: busy,
      hidden: !(canView.value && activo),
    },
    {
      key: 'historial',
      label: 'Ver en movimientos',
      icon: ICONS.history,
      disabled: busy,
      hidden: !(canListMovimientos.value && activo),
    },
    {
      key: 'ajuste',
      label: 'Ajuste',
      icon: ICONS.pencil,
      disabled: busy,
      hidden: !(canCreateMovimiento.value && activo),
    },
    {
      key: 'traslado',
      label: 'Traslado',
      icon: ICONS.arrowLeftRight,
      disabled: busy,
      hidden: !(canCreateMovimiento.value && activo),
    },
    {
      key: 'minimo',
      label: 'Stock mínimo',
      icon: ICONS.gauge,
      disabled: busy,
      hidden: !(canEdit.value && activo),
    },
    {
      key: 'restore',
      label: 'Restaurar',
      icon: ICONS.check,
      disabled: busy,
      loading: restaurarMutation.isPending.value,
      hidden: !(canRestore.value && !activo),
    },
    {
      key: 'delete',
      label: blockedByCantidad ? 'Eliminar (cantidad ≠ 0)' : 'Eliminar',
      icon: ICONS.trash,
      danger: !blockedByCantidad,
      disabled: busy || blockedByCantidad,
      hidden: !(canDelete.value && activo),
    },
  ]
}

function onActionSelect(key: string, row: Stock) {
  switch (key) {
    case 'detalle':
      openDetail(row)
      return
    case 'historial':
      void router.push({
        name: 'admin-inventario-movimientos',
        query: {
          idProducto: String(row.id_producto),
          idAlmacen: String(row.id_almacen),
          naturaleza: 'PRODUCTO',
        },
      })
      return
    case 'ajuste':
      void router.push({
        name: 'admin-inventario-movimientos',
        query: {
          tipo: 'AJUSTE',
          idProducto: String(row.id_producto),
          idAlmacen: String(row.id_almacen),
        },
      })
      return
    case 'traslado':
      void router.push({
        name: 'admin-inventario-movimientos',
        query: {
          tipo: 'TRASLADO',
          idProducto: String(row.id_producto),
          idAlmacen: String(row.id_almacen),
        },
      })
      return
    case 'minimo':
      openMinimoModal(row)
      return
    case 'restore':
      return restaurarStock(row)
    case 'delete':
      openDeleteModal(row)
      return
  }
}

const onStockSaved = () => {
  selectedStock.value = null
}
</script>
