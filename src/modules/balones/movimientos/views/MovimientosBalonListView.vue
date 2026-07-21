<template>
  <div>
    <PageBreadcrumb page-title="Movimientos" :items="breadcrumbItems" />

    <AppTable :columns="columns" :rows="rows" row-key="id" :loading="isLoading">
      <template #toolbar>
        <AppListToolbar
          v-model:search="buscar"
          v-model:filters="dynamicFilters"
          :filter-fields="filterFields"
          search-placeholder="Código, tipo, observación..."
          @filter-change="onFiltersChange"
        >
          <template #actions>
            <button
              v-if="canCreate"
              type="button"
              class="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white shadow-theme-xs transition hover:bg-brand-600"
              @click="openCreateModal"
            >
              <AppIcon :name="ICONS.plus" :size="18" />
              Nuevo
            </button>
          </template>
        </AppListToolbar>
      </template>

      <template #cell-fecha_movimiento="{ value }">
        <span class="whitespace-nowrap">{{ formatDateTime(value as string) }}</span>
      </template>

      <template #cell-codigo_balon="{ row }">
        <p class="font-medium text-gray-800 dark:text-white/90">
          {{ row.codigo_balon }}
        </p>
      </template>

      <template #cell-nombre_tipo_movimiento="{ value }">
        <ListaOpcionBadge :value="value as string" />
      </template>

      <template #cell-almacenes="{ row }">
        <span class="text-sm text-gray-600 dark:text-gray-400">
          <template v-if="row.nombre_almacen_origen || row.nombre_almacen_destino">
            {{ row.nombre_almacen_origen || '—' }}
            <span class="text-gray-400">/</span>
            {{ row.nombre_almacen_destino || '—' }}
          </template>
          <span v-else class="text-gray-400">—</span>
        </span>
      </template>

      <template #cell-nombre_cliente="{ value }">
        <span v-if="value">{{ value }}</span>
        <span v-else class="text-gray-400">—</span>
      </template>

      <!--
      <template #cell-observacion="{ value }">
        <span class="line-clamp-2 text-sm text-gray-600 dark:text-gray-400">
          {{ value || '—' }}
        </span>
      </template>
      -->

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

    <MovimientoBalonFormModal
      v-model="formModalOpen"
      :mode="formMode"
      :movimiento-id="selectedMovimientoId"
      @saved="onMovimientoSaved"
    />

    <MovimientoBalonDetailModal
      v-model="detailModalOpen"
      :movimiento-id="movimientoToViewId"
    />

    <AppModal
      v-model="deleteModalOpen"
      title="Eliminar movimiento"
      subtitle="Esta acción dará de baja el registro del movimiento."
      size="sm"
    >
      <p class="text-sm text-gray-600 dark:text-gray-400">
        ¿Confirmas que deseas eliminar el movimiento del cilindro
        <span class="font-medium text-gray-800 dark:text-white/90">
          {{ movimientoToDelete?.codigo_balon }}
        </span>
        del
        <span class="font-medium text-gray-800 dark:text-white/90">
          {{ formatDateTime(movimientoToDelete?.fecha_movimiento) }}
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
          Cancelar
        </button>
        <button
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
import { computed, ref, watch } from 'vue'
import PageBreadcrumb from '@/modules/admin/components/PageBreadcrumb.vue'
import MovimientoBalonFormModal from '@/modules/balones/movimientos/components/MovimientoBalonFormModal.vue'
import MovimientoBalonDetailModal from '@/modules/balones/movimientos/components/MovimientoBalonDetailModal.vue'
import { useDeleteMovimientoBalonMutation } from '@/modules/balones/movimientos/composables/useMovimientoBalonMutations'
import { useMovimientosBalonQuery } from '@/modules/balones/movimientos/composables/useMovimientosBalonQuery'
import type {
  MovimientoBalon,
  MovimientoBalonFormMode,
  MovimientoBalonListFilters,
} from '@/modules/balones/movimientos/interfaces/movimiento-balon.interface'
import { useBalonesQuery } from '@/modules/balones/cilindros/composables/useBalonesQuery'
import { balonesBreadcrumbItems } from '@/modules/balones/config/balones-breadcrumb'
import { useListaOpcionesQuery } from '@/modules/catalogos/composables/useListaOpcionesQuery'
import { toSelectOptions } from '@/modules/catalogos/utils/toSelectOptions'
import { useClientesQuery } from '@/modules/clientes/composables/useClientesQuery'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import {
  AppActionMenu,
  AppListToolbar,
  AppModal,
  AppPagination,
  AppTable,
  ListaOpcionBadge,
} from '@/shared/components'
import AppIcon from '@/shared/components/AppIcon.vue'
import { ICONS } from '@/shared/constants/icons'
import { ListaIds } from '@/shared/constants/lista-ids'
import { PermisoBanderas } from '@/shared/constants/permissions'
import type { ActionMenuItem } from '@/shared/interfaces/action-menu.interface'
import type { DynamicFilterFieldDef, DynamicFilterValues } from '@/shared/interfaces/dynamic-filter.interface'
import type { TableColumn } from '@/shared/interfaces/table.interface'
import { formatDateTime } from '@/shared/utils/date'

const authStore = useAuthStore()

const buscar = ref('')
const dynamicFilters = ref<DynamicFilterValues>({})
const pagina = ref(1)
const limite = ref(10)

const filters = ref<MovimientoBalonListFilters>({
  buscar: '',
  pagina: 1,
  limite: 10,
})

const movimientosQuery = useMovimientosBalonQuery(filters)

const balonesFilters = ref({ pagina: 1, limite: 200 })
const balonesQuery = useBalonesQuery(balonesFilters)

const clientesFilters = ref({ pagina: 1, limite: 200, soloActivos: 1 as number })
const clientesQuery = useClientesQuery(clientesFilters)

const listaTipoMovId = ref(ListaIds.TIPO_MOV_BALON)
const tiposMovimientoQuery = useListaOpcionesQuery(listaTipoMovId)

const formModalOpen = ref(false)
const formMode = ref<MovimientoBalonFormMode>('create')
const selectedMovimientoId = ref<number | null>(null)

const detailModalOpen = ref(false)
const movimientoToViewId = ref<number | null>(null)

const deleteModalOpen = ref(false)
const movimientoToDelete = ref<MovimientoBalon | null>(null)
const deleteMutation = useDeleteMovimientoBalonMutation()

const breadcrumbItems = balonesBreadcrumbItems('Movimientos')

const canCreate = computed(() =>
  authStore.hasPermission(PermisoBanderas.MOVIMIENTOS_BALON_CREAR),
)
const canView = computed(() =>
  authStore.hasPermission(PermisoBanderas.MOVIMIENTOS_BALON_VER),
)
const canEdit = computed(() =>
  authStore.hasPermission(PermisoBanderas.MOVIMIENTOS_BALON_EDITAR),
)
const canDelete = computed(() =>
  authStore.hasPermission(PermisoBanderas.MOVIMIENTOS_BALON_ELIMINAR),
)

const isLoading = computed(
  () => movimientosQuery.isFetching.value || movimientosQuery.isLoading.value,
)

const rows = computed(() => movimientosQuery.data.value?.data ?? [])

const columns: TableColumn[] = [
  { key: 'fecha_movimiento', label: 'Fecha' },
  { key: 'codigo_balon', label: 'Cilindro' },
  { key: 'nombre_tipo_movimiento', label: 'Tipo' },
  { key: 'almacenes', label: 'Origen / Destino' },
  { key: 'nombre_cliente', label: 'Cliente' },
  // { key: 'observacion', label: 'Observación' },
]

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
    key: 'idBalon',
    label: 'Cilindro',
    type: 'select',
    placeholder: 'Seleccionar cilindro',
    disabled: balonesQuery.isLoading.value,
    options: (balonesQuery.data.value?.data ?? []).map((balon) => ({
      value: balon.id,
      label: balon.codigo_balon,
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
  {
    key: 'idCliente',
    label: 'Cliente',
    type: 'select',
    placeholder: 'Seleccionar cliente',
    disabled: clientesQuery.isLoading.value,
    options: (clientesQuery.data.value?.data ?? []).map((cliente) => ({
      value: cliente.id,
      label:
        cliente.razon_social ||
        [cliente.nombres, cliente.apellido_paterno].filter(Boolean).join(' ') ||
        cliente.numero_documento,
    })),
  },
])

let buscarTimeout: ReturnType<typeof setTimeout> | undefined

const syncFilters = () => {
  const active = dynamicFilters.value

  filters.value = {
    buscar: buscar.value.trim(),
    pagina: pagina.value,
    limite: limite.value,
    fechaDesde: active.fechaDesde ? String(active.fechaDesde) : undefined,
    fechaHasta: active.fechaHasta ? String(active.fechaHasta) : undefined,
    idBalon: active.idBalon != null ? Number(active.idBalon) : undefined,
    idTipoMovimiento:
      active.idTipoMovimiento != null ? Number(active.idTipoMovimiento) : undefined,
    idCliente: active.idCliente != null ? Number(active.idCliente) : undefined,
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

watch([pagina, limite], () => {
  syncFilters()
})

const openCreateModal = () => {
  formMode.value = 'create'
  selectedMovimientoId.value = null
  formModalOpen.value = true
}

const openEditModal = (row: MovimientoBalon) => {
  formMode.value = 'edit'
  selectedMovimientoId.value = row.id
  formModalOpen.value = true
}

const openDetailModal = (row: MovimientoBalon) => {
  movimientoToViewId.value = row.id
  detailModalOpen.value = true
}

const openDeleteModal = (row: MovimientoBalon) => {
  movimientoToDelete.value = row
  deleteModalOpen.value = true
}

function actionItemsForRow(_row: MovimientoBalon): ActionMenuItem[] {
  return [
    {
      key: 'edit',
      label: 'Editar',
      icon: ICONS.pencil,
      hidden: !canEdit.value,
    },
    {
      key: 'delete',
      label: 'Eliminar',
      icon: ICONS.trash,
      danger: true,
      hidden: !canDelete.value,
    },
  ]
}

function onActionSelect(key: string, row: MovimientoBalon) {
  if (key === 'edit') openEditModal(row)
  if (key === 'delete') openDeleteModal(row)
}

const onMovimientoSaved = () => {
  movimientosQuery.refetch()
}

const confirmDelete = async () => {
  const movimiento = movimientoToDelete.value
  const userId = authStore.user?.id
  if (!movimiento || !userId) return

  try {
    await deleteMutation.mutateAsync({
      id: movimiento.id,
      idUsuarioAuditoria: userId,
    })
    deleteModalOpen.value = false
    movimientoToDelete.value = null
  } catch {
    // toast en mutation
  }
}
</script>
