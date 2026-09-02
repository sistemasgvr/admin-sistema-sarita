<template>
  <div>
    <PageBreadcrumb page-title="Movimientos de inventario" :items="breadcrumbItems" />

    <AppTable :columns="columns" :rows="rows" row-key="id" :loading="isLoading">
      <template #toolbar>
        <AppListToolbar
          v-model:search="buscar"
          v-model:filters="dynamicFilters"
          :filter-fields="filterFields"
          search-placeholder="Buscar por glosa, producto, balón..."
          @filter-change="onFiltersChange"
        >
          <template #actions>
            <button
              v-if="canCreate"
              type="button"
              class="inline-flex h-11 min-w-11 shrink-0 items-center justify-center gap-2 rounded-lg bg-brand-500 px-3 text-sm font-medium text-white shadow-theme-xs transition hover:bg-brand-600 sm:px-4"
              title="Nuevo movimiento"
              @click="crearModalOpen = true"
            >
              <AppIcon :name="ICONS.plus" :size="18" />
              <span class="hidden sm:inline">Nuevo movimiento</span>
            </button>
          </template>
        </AppListToolbar>
      </template>

      <template #cell-fecha="{ value }">
        <p class="font-medium text-gray-800 dark:text-white/90">{{ value }}</p>
      </template>

      <template #cell-naturaleza="{ value }">
        <AppBadge
          size="sm"
          :color="value === 'PRODUCTO' ? 'primary' : 'success'"
        >
          {{ value === 'PRODUCTO' ? 'Producto' : 'Balón' }}
        </AppBadge>
      </template>

      <template #cell-nombre_tipo_movimiento="{ value }">
        <span class="text-sm text-gray-600 dark:text-gray-400">{{ value ?? '—' }}</span>
      </template>

      <template #cell-producto_balon="{ row }">
        <div>
          <p class="font-medium text-gray-800 dark:text-white/90">
            {{ row.nombre_producto ?? row.numero_serie_balon ?? '—' }}
          </p>
          <p v-if="row.nombre_cliente" class="text-xs text-gray-500 dark:text-gray-400">
            {{ row.nombre_cliente }}
          </p>
        </div>
      </template>

      <template #cell-cantidad="{ value }">
        <span class="tabular-nums font-medium">{{ value }}</span>
      </template>

      <template #cell-almacenes="{ row }">
        <div class="text-sm">
          <p v-if="row.nombre_almacen_origen" class="text-gray-600 dark:text-gray-400">
            {{ row.nombre_almacen_origen }}
          </p>
          <p v-if="row.nombre_almacen_destino" class="text-xs text-gray-500 dark:text-gray-400">
            → {{ row.nombre_almacen_destino }}
          </p>
          <span v-else class="text-xs text-gray-400">—</span>
        </div>
      </template>

      <template #cell-glosa="{ value }">
        <p class="max-w-[12rem] truncate text-sm text-gray-500 dark:text-gray-400" :title="String(value ?? '')">
          {{ value ?? '—' }}
        </p>
      </template>

      <template #cell-estado="{ row }">
        <AppBadge :color="row.estado === 1 ? 'success' : 'error'">
          {{ row.estado === 1 ? 'Activo' : 'Anulado' }}
        </AppBadge>
      </template>

      <template #actions="{ row }">
        <div class="inline-flex items-center justify-end gap-1.5">
          <button
            v-if="canDelete && row.estado === 1 && row.puede_anular"
            type="button"
            title="Anular movimiento"
            class="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-300 text-gray-600 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
            @click="openAnular(row)"
          >
            <AppIcon :name="ICONS.ban" :size="15" />
          </button>
        </div>
      </template>

      <template #footer>
        <AppPagination
          v-model:pagina="pagina"
          v-model:limite="limite"
          :meta="inventarioQuery.data.value?.meta"
          :disabled="isLoading"
        />
      </template>
    </AppTable>

    <InventarioMovimientoCrearModal v-model="crearModalOpen" />

    <AppModal v-model="anularModalOpen" title="Anular movimiento" size="sm">
      <p class="text-sm text-gray-600 dark:text-gray-400">
        ¿Confirmas que deseas anular este movimiento de inventario?
      </p>
      <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
        Esta acción no se puede deshacer.
      </p>

      <template #footer>
        <button
          type="button"
          class="flex w-full justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 sm:w-auto"
          :disabled="anularMutation.isPending.value"
          @click="anularModalOpen = false"
        >
          Cancelar
        </button>
        <button
          type="button"
          class="flex w-full justify-center rounded-lg bg-error-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-error-600 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
          :disabled="anularMutation.isPending.value"
          @click="confirmAnular"
        >
          {{ anularMutation.isPending.value ? 'Anulando...' : 'Anular movimiento' }}
        </button>
      </template>
    </AppModal>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { useInventarioMovimientosQuery } from '../composables/useInventarioMovimientosQuery'
import { useEliminarInventarioMovimientoMutation } from '../composables/useInventarioMovimientoMutations'
import type { InventarioMovimientoListItem, InventarioMovimientoFilters } from '../interfaces/inventario-movimiento.interface'
import PageBreadcrumb from '@/modules/admin/components/PageBreadcrumb.vue'
import InventarioMovimientoCrearModal from '../components/InventarioMovimientoCrearModal.vue'
import {
  AppBadge,
  AppListToolbar,
  AppModal,
  AppPagination,
  AppTable,
} from '@/shared/components'
import AppIcon from '@/shared/components/AppIcon.vue'
import { ICONS } from '@/shared/constants/icons'
import { PermisoBanderas } from '@/shared/constants/permissions'
import type { DynamicFilterFieldDef, DynamicFilterValues } from '@/shared/interfaces/dynamic-filter.interface'
import type { TableColumn } from '@/shared/interfaces/table.interface'

const breadcrumbItems = [
  { label: 'Inventario', path: '/admin/inventario' },
  { label: 'Movimientos' },
]

const authStore = useAuthStore()

const dynamicFilters = ref<DynamicFilterValues>({})
const buscar = ref('')
const pagina = ref(1)
const limite = ref(10)

const filters = ref<InventarioMovimientoFilters>({
  buscar: '',
  pagina: 1,
  limite: 10,
})

const inventarioQuery = useInventarioMovimientosQuery(filters)
const anularMutation = useEliminarInventarioMovimientoMutation()

const crearModalOpen = ref(false)
const anularModalOpen = ref(false)
const movimientoToAnular = ref<InventarioMovimientoListItem | null>(null)

const canCreate = computed(() => authStore.hasPermission(PermisoBanderas.MOVIMIENTOS_CREAR))
const canDelete = computed(() => authStore.hasPermission(PermisoBanderas.MOVIMIENTOS_ELIMINAR))

const isLoading = computed(() => inventarioQuery.isFetching.value)
const rows = computed(() => inventarioQuery.data.value?.data ?? [])

const filterFields = computed<DynamicFilterFieldDef[]>(() => [
  {
    key: 'naturaleza',
    label: 'Naturaleza',
    type: 'select',
    placeholder: 'Todos',
    options: [
      { value: 'PRODUCTO', label: 'Producto' },
      { value: 'BALON', label: 'Balón' },
    ],
  },
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
])

const columns: TableColumn[] = [
  { key: 'fecha', label: 'Fecha', mobile: 'primary' },
  { key: 'naturaleza', label: 'Naturaleza', mobile: 'badge' },
  { key: 'nombre_tipo_movimiento', label: 'Tipo movimiento' },
  { key: 'producto_balon', label: 'Producto / Balón' },
  { key: 'cantidad', label: 'Cantidad', align: 'right' },
  { key: 'almacenes', label: 'Almacén origen → destino' },
  { key: 'glosa', label: 'Glosa' },
  { key: 'estado', label: 'Estado' },
]

function syncFilters() {
  const active = dynamicFilters.value

  filters.value = {
    buscar: buscar.value.trim(),
    pagina: pagina.value,
    limite: limite.value,
    naturaleza: (active.naturaleza as InventarioMovimientoFilters['naturaleza']) || undefined,
    fechaDesde: active.fechaDesde ? String(active.fechaDesde) : undefined,
    fechaHasta: active.fechaHasta ? String(active.fechaHasta) : undefined,
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

function openAnular(row: InventarioMovimientoListItem) {
  movimientoToAnular.value = row
  anularModalOpen.value = true
}

async function confirmAnular() {
  const row = movimientoToAnular.value
  const userId = authStore.user?.id
  if (!row || !userId) return

  await anularMutation.mutateAsync({ id: row.id, idUsuarioAuditoria: userId })
  anularModalOpen.value = false
}
</script>
