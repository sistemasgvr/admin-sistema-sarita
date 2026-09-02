<template>
  <div>
    <PageBreadcrumb
      page-title="Stock de gas"
      :items="breadcrumbItems"
      help="Saldo global de productos gas por almacén (pro_stock). El libro de cilindros gestiona los envases."
    />

    <AppSummaryCards :cards="resumenCards" />

    <AppTable :columns="columns" :rows="rows" row-key="rowKey" :loading="isLoading">
      <template #toolbar>
        <AppListToolbar
          v-model:search="buscar"
          v-model:filters="dynamicFilters"
          :filter-fields="filterFields"
          search-placeholder="Gas o almacén..."
          @filter-change="onFiltersChange"
        >
          <template #actions>
            <RouterLink
              v-if="canListCilindros"
              :to="{ name: 'admin-balones-cilindros' }"
              class="inline-flex h-11 min-w-11 shrink-0 items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-3 text-sm font-medium text-gray-700 shadow-theme-xs transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-white/[0.03] sm:px-4"
              title="Libro"
            >
              <AppIcon :name="ICONS.cylinder" :size="18" />
              <span class="hidden sm:inline">Libro</span>
            </RouterLink>
            <RouterLink
              v-if="canListMovimientos"
              :to="{ name: 'admin-inventario-movimientos', query: { naturaleza: 'PRODUCTO' } }"
              class="inline-flex h-11 min-w-11 shrink-0 items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-3 text-sm font-medium text-gray-700 shadow-theme-xs transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-white/[0.03] sm:px-4"
              title="Movimientos"
            >
              <AppIcon :name="ICONS.history" :size="18" />
              <span class="hidden sm:inline">Movimientos</span>
            </RouterLink>
          </template>
        </AppListToolbar>
      </template>

      <template #cell-producto="{ row }">
        <p class="truncate font-medium text-gray-800 dark:text-white/90">
          {{ row.nombre_producto || '—' }}
        </p>
        <p class="mt-0.5 truncate text-theme-xs text-gray-500 dark:text-gray-400">
          {{ row.codigo_producto || '—' }}
        </p>
      </template>

      <template #cell-nombre_almacen="{ value }">
        <span>{{ value || '—' }}</span>
      </template>

      <template #cell-capacidad_disponible="{ row }">
        <AppBadge size="sm" :color="row.bajo_minimo ? 'warning' : 'success'">
          {{ formatCapacidad(row.capacidad_disponible, row.nombre_unidad_medida || 'm³') }}
        </AppBadge>
      </template>

      <template #cell-stock_minimo="{ row }">
        <span class="tabular-nums text-sm text-gray-600 dark:text-gray-400">
          {{ formatCapacidad(row.stock_minimo, row.nombre_unidad_medida || 'm³') }}
        </span>
      </template>

      <template #cell-bajo_minimo="{ row }">
        <AppBadge v-if="row.bajo_minimo" size="sm" color="warning">Bajo mínimo</AppBadge>
        <AppBadge v-else size="sm" color="success">OK</AppBadge>
      </template>

      <template #actions="{ row }">
        <div class="inline-flex items-center justify-end gap-1.5">
          <button
            v-if="canListCilindros"
            type="button"
            title="Ver cilindros"
            class="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-300 text-gray-600 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
            @click="goToCilindros(row)"
          >
            <AppIcon :name="ICONS.eye" :size="15" />
          </button>

          <AppActionMenu
            :items="actionItemsForRow()"
            :execute="(key) => onActionSelect(key, row)"
          />
        </div>
      </template>

      <template #footer>
        <AppPagination
          v-model:pagina="pagina"
          v-model:limite="limite"
          :meta="stockGasQuery.data.value?.meta"
          :disabled="isLoading"
        />
      </template>
    </AppTable>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import PageBreadcrumb from '@/modules/admin/components/PageBreadcrumb.vue'
import { balonesBreadcrumbItems } from '@/modules/balones/config/balones-breadcrumb'
import { useStockGasQuery } from '@/modules/balones/stock-gas/composables/useStockGasQuery'
import type {
  StockGas,
  StockGasListFilters,
  StockGasResumen,
} from '@/modules/balones/stock-gas/interfaces/stock-gas.interface'
import { useAlmacenesQuery } from '@/modules/configuracion/almacenes/composables/useAlmacenesQuery'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import {
  AppActionMenu,
  AppBadge,
  AppListToolbar,
  AppPagination,
  AppSummaryCards,
  AppTable,
} from '@/shared/components'
import AppIcon from '@/shared/components/AppIcon.vue'
import type { SummaryCardItem } from '@/shared/components/ui/AppSummaryCards.vue'
import { ICONS } from '@/shared/constants/icons'
import { PermisoBanderas } from '@/shared/constants/permissions'
import type { ActionMenuItem } from '@/shared/interfaces/action-menu.interface'
import type { DynamicFilterFieldDef, DynamicFilterValues } from '@/shared/interfaces/dynamic-filter.interface'
import type { TableColumn } from '@/shared/interfaces/table.interface'

type StockGasRow = StockGas & { rowKey: string }

const authStore = useAuthStore()
const router = useRouter()

const breadcrumbItems = computed(() => balonesBreadcrumbItems('Stock de gas'))

const buscar = ref('')
const pagina = ref(1)
const limite = ref(20)
const dynamicFilters = ref<DynamicFilterValues>({})

const filters = ref<StockGasListFilters>({
  pagina: 1,
  limite: 20,
})

const stockGasQuery = useStockGasQuery(filters)
const almacenesFilters = ref({ pagina: 1, limite: 200 })
const almacenesQuery = useAlmacenesQuery(almacenesFilters)

const canListCilindros = computed(() => authStore.hasPermission(PermisoBanderas.BALONES_LISTAR))
const canListMovimientos = computed(() =>
  authStore.hasPermission(PermisoBanderas.INVENTARIO_MOVIMIENTOS_LISTAR),
)
const canCreateMovimiento = computed(() =>
  authStore.hasPermission(PermisoBanderas.INVENTARIO_MOVIMIENTOS_CREAR),
)
const canCreateRecarga = computed(() =>
  authStore.hasPermission(PermisoBanderas.MOVIMIENTOS_RECARGA_CREAR),
)
const canEditProducto = computed(() => authStore.hasPermission(PermisoBanderas.PRODUCTOS_EDITAR))
const canViewProducto = computed(() => authStore.hasPermission(PermisoBanderas.PRODUCTOS_VER))

const isLoading = computed(() => stockGasQuery.isFetching.value)
const rows = computed(() =>
  (stockGasQuery.data.value?.data ?? []).map((row) => ({
    ...row,
    rowKey: `${row.id_producto_gas}-${row.id_almacen ?? 'sin'}`,
  })),
)

const resumen = computed(
  () => (stockGasQuery.data.value?.meta?.resumen ?? {}) as StockGasResumen,
)

const resumenCards = computed<SummaryCardItem[]>(() => [
  {
    key: 'capacidad',
    label: 'Stock total',
    value: formatCapacidad(resumen.value.capacidad_disponible, 'm³'),
    icon: ICONS.gauge,
    iconClass: 'bg-brand-100 text-brand-600 dark:bg-brand-500/20 dark:text-brand-300',
  },
  {
    key: 'productos',
    label: 'Productos gas',
    value: String(resumen.value.total_productos ?? 0),
    icon: ICONS.package,
    iconClass: 'bg-success-100 text-success-700 dark:bg-success-500/20 dark:text-success-300',
  },
  {
    key: 'bajo',
    label: 'Bajo mínimo',
    value: String(resumen.value.bajo_minimo ?? 0),
    icon: ICONS.alertTriangle,
    iconClass: 'bg-warning-100 text-warning-700 dark:bg-warning-500/20 dark:text-warning-300',
  },
])

const filterFields = computed<DynamicFilterFieldDef[]>(() => [
  {
    key: 'idAlmacen',
    label: 'Almacén',
    type: 'select',
    placeholder: 'Todos',
    disabled: almacenesQuery.isLoading.value,
    options: (almacenesQuery.data.value?.data ?? []).map((almacen) => ({
      label: almacen.nombre,
      value: almacen.id,
    })),
  },
])

const columns = computed<TableColumn<StockGasRow>[]>(() => [
  { key: 'producto', label: 'Gas' },
  { key: 'nombre_almacen', label: 'Almacén' },
  { key: 'capacidad_disponible', label: 'Stock', cellClass: 'whitespace-nowrap' },
  { key: 'stock_minimo', label: 'Mínimo', cellClass: 'whitespace-nowrap' },
  { key: 'bajo_minimo', label: 'Estado', cellClass: 'whitespace-nowrap' },
])

function formatCapacidad(value?: number | null, unidad?: string | null) {
  const n = Number(value ?? 0)
  const formatted = Number.isFinite(n)
    ? n.toLocaleString('es-PE', { maximumFractionDigits: 2 })
    : '0'
  return unidad ? `${formatted} ${unidad}` : formatted
}

function goToCilindros(row: StockGas) {
  const query: Record<string, string> = {
    idProductoGas: String(row.id_producto_gas),
  }
  const gasLabel = row.nombre_producto || row.codigo_producto
  if (gasLabel) query.gas = gasLabel
  if (row.id_almacen != null) query.idAlmacen = String(row.id_almacen)
  void router.push({
    name: 'admin-balones-cilindros',
    query,
  })
}

function actionItemsForRow(): ActionMenuItem[] {
  return [
    {
      key: 'cilindros',
      label: 'Ver cilindros',
      icon: ICONS.cylinder,
      hidden: !canListCilindros.value,
    },
    {
      key: 'movimientos',
      label: 'Ver movimientos',
      icon: ICONS.history,
      hidden: !canListMovimientos.value,
    },
    {
      key: 'ajuste',
      label: 'Ajuste de stock',
      icon: ICONS.pencil,
      hidden: !canCreateMovimiento.value,
    },
    {
      key: 'recarga',
      label: 'Recargar balón',
      icon: ICONS.droplet,
      hidden: !canCreateRecarga.value,
    },
    {
      key: 'precio',
      label: 'Editar precio / catálogo',
      icon: ICONS.pencil,
      hidden: !(canEditProducto.value || canViewProducto.value),
    },
  ]
}

function onActionSelect(key: string, row: StockGasRow) {
  switch (key) {
    case 'cilindros':
      goToCilindros(row)
      return
    case 'movimientos':
      void router.push({
        name: 'admin-inventario-movimientos',
        query: {
          naturaleza: 'PRODUCTO',
          idProducto: String(row.id_producto_gas),
          idAlmacen: row.id_almacen != null ? String(row.id_almacen) : undefined,
        },
      })
      return
    case 'ajuste':
      void router.push({
        name: 'admin-inventario-movimientos',
        query: {
          tipo: 'AJUSTE',
          idProducto: String(row.id_producto_gas),
          idAlmacen: row.id_almacen != null ? String(row.id_almacen) : undefined,
        },
      })
      return
    case 'recarga':
      void router.push({ name: 'admin-ventas-pos', query: { tab: 'recarga' } })
      return
    case 'precio':
      void router.push({
        name: canEditProducto.value
          ? 'admin-productos-articulos-editar'
          : 'admin-productos-articulos-detalle',
        params: { id: String(row.id_producto_gas) },
      })
      return
  }
}

const syncFilters = () => {
  const active = dynamicFilters.value
  filters.value = {
    buscar: buscar.value.trim(),
    pagina: pagina.value,
    limite: limite.value,
    idAlmacen: active.idAlmacen != null ? Number(active.idAlmacen) : undefined,
  }
}

let buscarTimeout: ReturnType<typeof setTimeout> | undefined
watch(buscar, () => {
  if (buscarTimeout) clearTimeout(buscarTimeout)
  buscarTimeout = setTimeout(() => {
    pagina.value = 1
    syncFilters()
  }, 300)
})

watch([pagina, limite], () => syncFilters())

const onFiltersChange = () => {
  pagina.value = 1
  syncFilters()
}

syncFilters()
</script>
