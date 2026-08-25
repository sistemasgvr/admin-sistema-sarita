<template>
  <div>
    <PageBreadcrumb page-title="Gastos de caja" :items="breadcrumbItems" />

    <AppSummaryChips :chips="summaryChips" />

    <AppTable :columns="columns" :rows="rows" row-key="id" :loading="isLoading">
      <template #toolbar>
        <AppListToolbar
          v-model:search="buscar"
          v-model:filters="dynamicFilters"
          :filter-fields="filterFields"
          search-placeholder="Concepto, observación o N° operación..."
          @filter-change="onFiltersChange"
        >
          <template #actions>
            <button
              v-if="canRegistrar"
              type="button"
              class="inline-flex h-11 min-w-11 shrink-0 items-center justify-center gap-2 rounded-lg bg-brand-500 px-3 text-sm font-medium text-white shadow-theme-xs transition hover:bg-brand-600 sm:px-4"
              title="Nuevo gasto"
              @click="openCreate"
            >
              <AppIcon :name="ICONS.plus" :size="18" />
              <span class="hidden sm:inline">Nuevo gasto</span>
            </button>
          </template>
        </AppListToolbar>
      </template>

      <template #cell-concepto="{ row }">
        <p class="font-medium text-gray-800 dark:text-white/90">{{ row.concepto }}</p>
        <p class="text-xs text-gray-500 dark:text-gray-400">{{ row.fecha?.slice(0, 10) }}</p>
      </template>

      <template #cell-categoriaGasto="{ value }">
        <AppBadge v-if="value" size="sm" variant="light" color="neutral">
          {{ formatListaOpcionLabel(String(value)) }}
        </AppBadge>
        <span v-else class="text-xs text-gray-400">—</span>
      </template>

      <template #cell-monto="{ value }">
        <span class="tabular-nums">{{ formatMoney(Number(value ?? 0)) }}</span>
      </template>

      <template #actions="{ row }">
        <div class="inline-flex items-center justify-end gap-1.5">
          <button
            type="button"
            title="Ver detalle"
            class="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-300 text-gray-600 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
            @click="openDetail(row)"
          >
            <AppIcon :name="ICONS.eye" :size="15" />
          </button>

          <AppActionMenu
            v-if="canRegistrar"
            :items="actionItemsForRow"
            :execute="(key) => onActionSelect(key, row)"
          />
        </div>
      </template>

      <template #footer>
        <AppPagination
          v-model:pagina="pagina"
          v-model:limite="limite"
          :meta="gastosQuery.data.value?.meta"
          :disabled="isLoading"
        />
      </template>
    </AppTable>

    <RegistrarGastoCajaModal
      v-model="formModalOpen"
      :fecha="formFecha"
      :gasto="gastoSeleccionado"
      @saved="formModalOpen = false"
    />

    <AppModal v-model="detailModalOpen" title="Detalle del gasto" size="sm">
      <div v-if="gastoDetalleQuery.isFetching.value && !gastoDetalle" class="py-6 text-center text-sm text-gray-500 dark:text-gray-400">
        Cargando...
      </div>
      <div v-else-if="gastoDetalle" class="space-y-3 text-sm">
        <div class="grid grid-cols-2 gap-3">
          <div>
            <p class="text-xs text-gray-500 dark:text-gray-400">Fecha</p>
            <p class="font-medium text-gray-800 dark:text-white/90">
              {{ gastoDetalle.fecha?.slice(0, 10) }}
            </p>
          </div>
          <div>
            <p class="text-xs text-gray-500 dark:text-gray-400">Monto</p>
            <p class="font-medium text-gray-800 dark:text-white/90">
              {{ formatMoney(Number(gastoDetalle.monto ?? 0)) }}
            </p>
          </div>
        </div>
        <div>
          <p class="text-xs text-gray-500 dark:text-gray-400">Concepto</p>
          <p class="font-medium text-gray-800 dark:text-white/90">{{ gastoDetalle.concepto }}</p>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <p class="text-xs text-gray-500 dark:text-gray-400">Categoría</p>
            <p class="font-medium text-gray-800 dark:text-white/90">
              {{ gastoDetalle.categoriaGasto ? formatListaOpcionLabel(gastoDetalle.categoriaGasto) : '—' }}
            </p>
          </div>
          <div>
            <p class="text-xs text-gray-500 dark:text-gray-400">Medio de pago</p>
            <p class="font-medium text-gray-800 dark:text-white/90">
              {{ gastoDetalle.medioPago ?? '—' }}
            </p>
          </div>
        </div>
        <div>
          <p class="text-xs text-gray-500 dark:text-gray-400">N° operación</p>
          <p class="font-medium text-gray-800 dark:text-white/90">
            {{ gastoDetalle.numeroOperacion || '—' }}
          </p>
        </div>
        <div>
          <p class="text-xs text-gray-500 dark:text-gray-400">Observación</p>
          <p class="font-medium text-gray-800 dark:text-white/90">
            {{ gastoDetalle.observacion || '—' }}
          </p>
        </div>
      </div>

      <template #footer>
        <button
          type="button"
          class="flex w-full justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 sm:w-auto"
          @click="detailModalOpen = false"
        >
          Cerrar
        </button>
      </template>
    </AppModal>

    <AppConfirmDialog
      v-model="eliminarModalOpen"
      title="Anular gasto de caja"
      :message="`¿Confirmas que deseas anular el gasto «${gastoSeleccionado?.concepto ?? ''}»? Solo es posible mientras la caja siga abierta.`"
      confirm-label="Anular gasto"
      variant="danger"
      :loading="eliminarMutation.isPending.value"
      @confirm="confirmEliminar"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import {
  useCajaGastoDetailQuery,
  useCajaGastosQuery,
  useEliminarCajaGastoMutation,
} from '@/modules/caja/composables/useCajaQuery'
import type { CajaGastosListFilters, CajaMovimientoGasto } from '@/modules/caja/interfaces/caja.interface'
import RegistrarGastoCajaModal from '@/modules/caja/components/RegistrarGastoCajaModal.vue'
import { comprasBreadcrumbItems } from '@/modules/compras/config/compras-breadcrumb'
import { useListaOpcionesQuery } from '@/modules/catalogos/composables/useListaOpcionesQuery'
import { toSelectOptions } from '@/modules/catalogos/utils/toSelectOptions'
import { formatListaOpcionLabel } from '@/shared/utils/formatListaOpcion'
import { hoyIsoLima } from '@/shared/utils/date'
import { ListaIds } from '@/shared/constants/lista-ids'
import { PermisoBanderas } from '@/shared/constants/permissions'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import PageBreadcrumb from '@/modules/admin/components/PageBreadcrumb.vue'
import {
  AppActionMenu,
  AppBadge,
  AppConfirmDialog,
  AppListToolbar,
  AppModal,
  AppPagination,
  AppSummaryChips,
  AppTable,
} from '@/shared/components'
import AppIcon from '@/shared/components/AppIcon.vue'
import { ICONS } from '@/shared/constants/icons'
import type { ActionMenuItem } from '@/shared/interfaces/action-menu.interface'
import type { DynamicFilterFieldDef, DynamicFilterValues } from '@/shared/interfaces/dynamic-filter.interface'
import type { SummaryChip } from '@/shared/interfaces/summary-chip.interface'
import type { TableColumn } from '@/shared/interfaces/table.interface'

const breadcrumbItems = comprasBreadcrumbItems('Gastos de caja')

const authStore = useAuthStore()
const canRegistrar = computed(() => authStore.hasPermission(PermisoBanderas.CAJA_REGISTRAR_GASTO))

const dynamicFilters = ref<DynamicFilterValues>({})
const buscar = ref('')
const pagina = ref(1)
const limite = ref(10)

const filters = ref<CajaGastosListFilters>({
  buscar: '',
  pagina: 1,
  limite: 10,
})

const gastosQuery = useCajaGastosQuery(filters)
const isLoading = computed(() => gastosQuery.isFetching.value)
const rows = computed(() => gastosQuery.data.value?.data ?? [])

const categoriaGastoQuery = useListaOpcionesQuery(computed(() => ListaIds.CATEGORIA_GASTO))

const filterFields = computed<DynamicFilterFieldDef[]>(() => [
  { key: 'fechaDesde', label: 'Desde', type: 'date' },
  { key: 'fechaHasta', label: 'Hasta', type: 'date' },
  {
    key: 'idCategoriaGasto',
    label: 'Categoría',
    type: 'select',
    placeholder: 'Seleccionar',
    disabled: categoriaGastoQuery.isLoading.value,
    options: toSelectOptions(categoriaGastoQuery.data.value),
  },
])

const columns: TableColumn[] = [
  { key: 'concepto', label: 'Concepto', mobile: 'primary' },
  { key: 'categoriaGasto', label: 'Categoría' },
  { key: 'medioPago', label: 'Medio de pago' },
  { key: 'monto', label: 'Monto', align: 'right' },
  { key: 'observacion', label: 'Observación' },
]

const summaryChips = computed<SummaryChip[]>(() => [
  { label: 'Total gastos', value: gastosQuery.data.value?.meta?.total ?? 0, color: 'primary' },
  {
    label: 'Monto del periodo',
    value: formatMoney(Number((gastosQuery.data.value?.meta?.resumen as { total?: number })?.total ?? 0)),
    color: 'neutral',
  },
])

function syncFilters() {
  const active = dynamicFilters.value

  filters.value = {
    buscar: buscar.value.trim(),
    pagina: pagina.value,
    limite: limite.value,
    fechaDesde: active.fechaDesde ? String(active.fechaDesde) : undefined,
    fechaHasta: active.fechaHasta ? String(active.fechaHasta) : undefined,
    idCategoriaGasto: active.idCategoriaGasto != null ? Number(active.idCategoriaGasto) : undefined,
  }
}

function onFiltersChange() {
  pagina.value = 1
  syncFilters()
}

let buscarTimeout: ReturnType<typeof setTimeout> | undefined
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

/* ---------- Crear / editar / ver detalle / anular ---------- */
const formModalOpen = ref(false)
const detailModalOpen = ref(false)
const eliminarModalOpen = ref(false)
const gastoSeleccionado = ref<CajaMovimientoGasto | null>(null)
const formFecha = ref(hoyIsoLima())
const eliminarMutation = useEliminarCajaGastoMutation()

const idGastoDetalle = computed(() => gastoSeleccionado.value?.id)
const gastoDetalleQuery = useCajaGastoDetailQuery(idGastoDetalle, detailModalOpen)
const gastoDetalle = computed(() => gastoDetalleQuery.data.value ?? gastoSeleccionado.value)

const actionItemsForRow: ActionMenuItem[] = [
  { key: 'edit', label: 'Editar', icon: ICONS.pencil },
  { key: 'eliminar', label: 'Anular', icon: ICONS.trash, danger: true },
]

function openCreate() {
  gastoSeleccionado.value = null
  formFecha.value = hoyIsoLima()
  formModalOpen.value = true
}

function openDetail(row: CajaMovimientoGasto) {
  gastoSeleccionado.value = row
  detailModalOpen.value = true
}

function openEdit(row: CajaMovimientoGasto) {
  gastoSeleccionado.value = row
  formModalOpen.value = true
}

function openEliminar(row: CajaMovimientoGasto) {
  gastoSeleccionado.value = row
  eliminarModalOpen.value = true
}

function onActionSelect(key: string, row: CajaMovimientoGasto) {
  switch (key) {
    case 'edit':
      return openEdit(row)
    case 'eliminar':
      return openEliminar(row)
  }
}

async function confirmEliminar() {
  const row = gastoSeleccionado.value
  if (!row) return
  await eliminarMutation.mutateAsync(row.id)
  eliminarModalOpen.value = false
}
</script>
