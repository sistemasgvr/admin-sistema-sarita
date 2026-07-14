<template>
  <div>
    <PageBreadcrumb page-title="Resumen diario" :items="breadcrumbItems" />

    <AppTable :columns="columns" :rows="rows" row-key="id" :loading="isLoading">
      <template #toolbar>
        <AppListToolbar
          v-model:search="buscar"
          v-model:filters="dynamicFilters"
          :filter-fields="filterFields"
          search-placeholder="Identificador, ticket o correlativo..."
          @filter-change="onFiltersChange"
        >
          <template #actions>
            <button
              type="button"
              class="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white shadow-theme-xs transition hover:bg-brand-600"
              @click="nuevoModalOpen = true"
            >
              <AppIcon :name="ICONS.plus" :size="18" />
              Nuevo resumen
            </button>
          </template>
        </AppListToolbar>
      </template>

      <template #cell-identificador="{ row }">
        <p class="font-medium text-gray-800 dark:text-white/90">
          {{ row.identificador ?? `RC-${row.fecha}-${row.correlativo}` }}
        </p>
        <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
          {{ formatFechaUi(row.fecha) }} · Correlativo {{ row.correlativo }}
        </p>
      </template>

      <template #cell-cantidad_docs="{ value }">
        <span class="tabular-nums">{{ value }}</span>
      </template>

      <template #cell-total_importe="{ value }">
        <span class="tabular-nums">{{ formatMoney(Number(value ?? 0)) }}</span>
      </template>

      <template #cell-nombre_estado_sunat="{ value }">
        <ListaOpcionBadge :value="String(value ?? 'PENDIENTE')" raw />
      </template>

      <template #actions="{ row }">
        <div class="inline-flex flex-wrap items-center justify-end gap-1.5">
          <button
            type="button"
            title="Ver detalle"
            class="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-300 text-gray-600 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
            @click="openDetail(row)"
          >
            <AppIcon :name="ICONS.eye" :size="15" />
          </button>
          <button
            v-if="row.ticket_sunat"
            type="button"
            title="Consultar estado SUNAT"
            class="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-300 text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
            @click="openDetail(row, true)"
          >
            <AppIcon :name="ICONS.refreshCw" :size="15" />
          </button>
        </div>
      </template>

      <template #footer>
        <AppPagination
          v-model:pagina="pagina"
          v-model:limite="limite"
          :meta="listQuery.data.value?.meta"
          :disabled="isLoading"
        />
      </template>
    </AppTable>

    <ResumenDiarioNuevoModal v-model="nuevoModalOpen" @created="onCreated" />

    <ResumenDiarioDetailModal
      v-model="detailModalOpen"
      :resumen="resumenToView"
      :auto-consultar="autoConsultar"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import {
  useComprobanteCatalogosPosQuery,
  useResumenDiarioListQuery,
} from '@/modules/ventas/comprobantes/composables/useComprobantesQuery'
import ResumenDiarioDetailModal from '@/modules/ventas/comprobantes/components/ResumenDiarioDetailModal.vue'
import ResumenDiarioNuevoModal from '@/modules/ventas/comprobantes/components/ResumenDiarioNuevoModal.vue'
import type {
  ResumenDiarioListFilters,
  ResumenDiarioListItem,
} from '@/modules/ventas/comprobantes/interfaces/comprobante.interface'
import PageBreadcrumb from '@/modules/admin/components/PageBreadcrumb.vue'
import { ventasBreadcrumbItems } from '@/modules/ventas/config/ventas-breadcrumb'
import { toSelectOptions } from '@/modules/catalogos/utils/toSelectOptions'
import {
  AppListToolbar,
  AppPagination,
  AppTable,
  ListaOpcionBadge,
} from '@/shared/components'
import AppIcon from '@/shared/components/AppIcon.vue'
import { ICONS } from '@/shared/constants/icons'
import type {
  DynamicFilterFieldDef,
  DynamicFilterValues,
} from '@/shared/interfaces/dynamic-filter.interface'
import type { TableColumn } from '@/shared/interfaces/table.interface'

const breadcrumbItems = ventasBreadcrumbItems('Resumen diario')

const buscar = ref('')
const dynamicFilters = ref<DynamicFilterValues>({})
const pagina = ref(1)
const limite = ref(10)

const filters = ref<ResumenDiarioListFilters>({
  buscar: '',
  pagina: 1,
  limite: 10,
})

const listQuery = useResumenDiarioListQuery(filters)
const catalogosQuery = useComprobanteCatalogosPosQuery()

const nuevoModalOpen = ref(false)
const detailModalOpen = ref(false)
const resumenToView = ref<ResumenDiarioListItem | null>(null)
const autoConsultar = ref(false)

const isLoading = computed(() => listQuery.isFetching.value)
const rows = computed(() => listQuery.data.value?.data ?? [])

const filterFields = computed<DynamicFilterFieldDef[]>(() => [
  { key: 'fechaDesde', label: 'Desde', type: 'date' },
  { key: 'fechaHasta', label: 'Hasta', type: 'date' },
  {
    key: 'idEstadoSunat',
    label: 'Estado SUNAT',
    type: 'select',
    placeholder: 'Pendiente, aceptado...',
    disabled: catalogosQuery.isLoading.value || catalogosQuery.isFetching.value,
    options: toSelectOptions(catalogosQuery.data.value?.estadosSunat),
  },
])

const columns: TableColumn[] = [
  { key: 'identificador', label: 'Resumen', mobile: 'primary' },
  { key: 'cantidad_docs', label: 'Docs', align: 'right' },
  { key: 'total_importe', label: 'Total', align: 'right' },
  { key: 'nombre_estado_sunat', label: 'SUNAT', mobile: 'badge' },
]

let buscarTimeout: ReturnType<typeof setTimeout> | undefined

function syncFilters() {
  const active = dynamicFilters.value
  filters.value = {
    buscar: buscar.value.trim(),
    pagina: pagina.value,
    limite: limite.value,
    fechaDesde: active.fechaDesde ? String(active.fechaDesde) : undefined,
    fechaHasta: active.fechaHasta ? String(active.fechaHasta) : undefined,
    idEstadoSunat:
      active.idEstadoSunat != null ? Number(active.idEstadoSunat) : undefined,
  }
}

function onFiltersChange() {
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

watch([pagina, limite], () => {
  syncFilters()
})

function formatMoney(value: number) {
  return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(value)
}

function formatFechaUi(value: string) {
  const base = String(value ?? '').slice(0, 10)
  const [y, m, d] = base.split('-')
  if (!y || !m || !d) return value
  return `${d}/${m}/${y}`
}

function openDetail(row: ResumenDiarioListItem, consultar = false) {
  resumenToView.value = row
  autoConsultar.value = consultar
  detailModalOpen.value = true
}

function onCreated(id: number) {
  void listQuery.refetch()
  resumenToView.value = {
    id,
    fecha: '',
    correlativo: '',
    cantidad_docs: 0,
    total_importe: 0,
  }
  autoConsultar.value = true
  detailModalOpen.value = true
}
</script>
