<template>
  <div>
    <PageBreadcrumb page-title="Stock de gas" :items="breadcrumbItems" />

    <div
      class="mb-4 rounded-xl border border-brand-200 bg-brand-50/60 px-4 py-3 text-sm text-brand-900 dark:border-brand-500/30 dark:bg-brand-500/10 dark:text-brand-200"
    >
      El stock disponible es la suma del residual de los cilindros
      <strong>empresa</strong> <strong>Llenos</strong> en almacén. Las recargas cliente descuentan
      ese residual del balón origen.
    </div>

    <div class="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <div
        v-for="card in resumenCards"
        :key="card.label"
        class="rounded-xl border border-gray-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-gray-900"
      >
        <p class="text-theme-xs text-gray-500 dark:text-gray-400">{{ card.label }}</p>
        <p class="mt-1 text-lg font-semibold text-gray-800 dark:text-white/90">
          {{ card.value }}
        </p>
      </div>
    </div>

    <AppTable :columns="columns" :rows="rows" row-key="rowKey" :loading="isLoading">
      <template #toolbar>
        <AppListToolbar
          v-model:search="buscar"
          v-model:filters="dynamicFilters"
          :filter-fields="filterFields"
          search-placeholder="Gas o almacén..."
          @filter-change="onFiltersChange"
        />
      </template>

      <template #cell-producto="{ row }">
        <p class="truncate font-medium text-gray-800 dark:text-white/90">
          {{ row.nombre_producto || '—' }}
        </p>
        <p class="mt-0.5 truncate text-theme-xs text-gray-500 dark:text-gray-400">
          {{ row.codigo_producto || '—' }}
        </p>
      </template>

      <template #cell-capacidad_disponible="{ row }">
        <AppBadge
          size="sm"
          :color="row.tiene_stock_disponible ? 'success' : 'neutral'"
        >
          {{ formatCapacidad(row.capacidad_disponible, row.nombre_unidad_medida) }}
        </AppBadge>
      </template>

      <template #cell-balones_llenos="{ value }">
        <AppBadge size="sm" color="success">{{ value ?? 0 }} llenos</AppBadge>
      </template>

      <template #cell-balones_vacios="{ value }">
        <AppBadge size="sm" color="neutral">{{ value ?? 0 }} vacíos</AppBadge>
      </template>

      <template #cell-balones_llenos_fuera="{ value }">
        <AppBadge v-if="Number(value) > 0" size="sm" color="warning">
          {{ value }} fuera
        </AppBadge>
        <span v-else class="text-gray-400">—</span>
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
import PageBreadcrumb from '@/modules/admin/components/PageBreadcrumb.vue'
import { balonesBreadcrumbItems } from '@/modules/balones/config/balones-breadcrumb'
import { useStockGasQuery } from '@/modules/balones/stock-gas/composables/useStockGasQuery'
import type {
  StockGas,
  StockGasListFilters,
  StockGasResumen,
} from '@/modules/balones/stock-gas/interfaces/stock-gas.interface'
import { useAlmacenesQuery } from '@/modules/configuracion/almacenes/composables/useAlmacenesQuery'
import {
  AppBadge,
  AppListToolbar,
  AppPagination,
  AppTable,
} from '@/shared/components'
import type { DynamicFilterFieldDef, DynamicFilterValues } from '@/shared/interfaces/dynamic-filter.interface'
import type { TableColumn } from '@/shared/interfaces/table.interface'

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

const resumenCards = computed(() => [
  {
    label: 'Capacidad disponible',
    value: formatCapacidad(resumen.value.capacidad_disponible, null),
  },
  {
    label: 'Cilindros llenos (almacén)',
    value: String(resumen.value.balones_llenos ?? 0),
  },
  {
    label: 'Cilindros vacíos (almacén)',
    value: String(resumen.value.balones_vacios ?? 0),
  },
  {
    label: 'Llenos fuera de almacén',
    value: String(resumen.value.balones_llenos_fuera ?? 0),
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

const columns = computed<TableColumn<StockGas & { rowKey: string }>[]>(() => [
  { key: 'producto', label: 'Gas' },
  { key: 'nombre_almacen', label: 'Almacén' },
  { key: 'capacidad_disponible', label: 'Stock disponible', cellClass: 'whitespace-nowrap' },
  { key: 'balones_llenos', label: 'Llenos', cellClass: 'whitespace-nowrap' },
  { key: 'balones_vacios', label: 'Vacíos', cellClass: 'whitespace-nowrap' },
  { key: 'balones_llenos_fuera', label: 'Llenos fuera', cellClass: 'whitespace-nowrap' },
])

function formatCapacidad(value?: number | null, unidad?: string | null) {
  const n = Number(value ?? 0)
  const formatted = Number.isFinite(n)
    ? n.toLocaleString('es-PE', { maximumFractionDigits: 2 })
    : '0'
  return unidad ? `${formatted} ${unidad}` : formatted
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
