<template>
  <div>
    <PageBreadcrumb :page-title="pageTitle" :items="breadcrumbItems" />

    <AppSummaryChips :chips="summaryChips" />

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
          search-placeholder="Buscar por descripción, marca, modelo o serie..."
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

        <div class="grid grid-cols-2 gap-3 px-1 pt-3 sm:grid-cols-4">
          <AppDatePicker v-model="fechaDesde" label="Compra desde" @update:model-value="onExtraFilterChange" />
          <AppDatePicker v-model="fechaHasta" label="Compra hasta" @update:model-value="onExtraFilterChange" />
          <AppInput v-model="importeMin" type="number" step="0.01" label="Importe mín." @update:model-value="onExtraFilterChange" />
          <AppInput v-model="importeMax" type="number" step="0.01" label="Importe máx." @update:model-value="onExtraFilterChange" />
        </div>
      </template>

      <template #cell-imagen="{ row }">
        <div
          class="flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg border border-gray-200 bg-gray-50 dark:border-gray-700"
        >
          <img
            v-if="row.url_imagen_principal"
            :src="row.url_imagen_principal"
            alt="Imagen"
            class="h-full w-full object-cover"
          />
          <AppIcon v-else :name="ICONS.image" :size="16" class="text-gray-400" />
        </div>
      </template>

      <template #cell-descripcion="{ row }">
        <p
          class="max-w-[18rem] truncate font-medium text-gray-800 dark:text-white/90"
          :title="row.descripcion || '—'"
        >
          {{ row.descripcion || '—' }}
        </p>
        <AppBadge v-if="row.nombre_tipo" class="mt-0.5" color="neutral" size="sm">
          {{ formatListaOpcionLabel(row.nombre_tipo || '—') }}
        </AppBadge>
      </template>

      <template #cell-sucursal="{ row }">
        <p class="truncate text-sm text-gray-700 dark:text-gray-300">{{ row.nombre_sucursal || '—' }}</p>
      </template>

      <template #cell-marca_modelo="{ row }">
        <p class="truncate text-sm text-gray-700 dark:text-gray-300">{{ row.marca || '—' }}</p>
        <p class="text-xs text-gray-500 dark:text-gray-400">{{ row.modelo || '—' }}</p>
      </template>

      <template #cell-importe="{ row }">
        <p class="text-sm text-gray-700 dark:text-gray-300">
          {{ row.importe != null ? `S/ ${Number(row.importe).toFixed(2)}` : '—' }}
        </p>
      </template>

      <template #cell-estado="{ row }">
        <AppBadge :color="row.estado === 1 ? 'success' : 'error'">
          {{ row.estado === 1 ? 'Activo' : 'Inactivo' }}
        </AppBadge>
      </template>

      <template #actions="{ row }">
        <button
          type="button"
          class="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm font-medium text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/5"
          @click="openDetailModal(row)"
        >
          <AppIcon :name="ICONS.eye" :size="16" />
        </button>

        <button
          v-if="canEdit"
          type="button"
          class="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm font-medium text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-500/10"
          @click="openEditModal(row)"
        >
          <AppIcon :name="ICONS.pencil" :size="16" />
        </button>

        <button
          v-if="canDelete && row.estado === 1"
          type="button"
          class="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm font-medium text-error-500 hover:bg-error-500/10"
          @click="openDeleteModal(row)"
        >
          <AppIcon :name="ICONS.trash" :size="16" />
        </button>
      </template>

      <template #footer>
        <AppPagination
          v-model:pagina="pagina"
          v-model:limite="limite"
          :meta="activosQuery.data.value?.meta"
          :disabled="isLoading"
        />
      </template>
    </AppTable>

    <ActivoFormModal v-model="formModalOpen" :mode="formMode" :activo="selectedActivo" @saved="onSaved" />

    <ActivoDetailModal v-model="detailModalOpen" :activo="activoToView" />

    <AppModal
      v-model="deleteModalOpen"
      title="Dar de baja a activo"
      subtitle="Esta acción marcará el activo como inactivo (baja lógica)."
      size="sm"
    >
      <p class="text-sm text-gray-600 dark:text-gray-400">
        ¿Confirmas que deseas dar de baja a
        <span class="font-medium text-gray-800 dark:text-white/90">
          {{ activoToDelete?.descripcion || '' }}
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
          {{ deleteMutation.isPending.value ? 'Dando de baja...' : 'Dar de baja' }}
        </button>
      </template>
    </AppModal>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import PageBreadcrumb from '@/modules/admin/components/PageBreadcrumb.vue'
import ActivoDetailModal from '@/modules/activos/components/ActivoDetailModal.vue'
import ActivoFormModal from '@/modules/activos/components/ActivoFormModal.vue'
import { useDeleteActivoMutation } from '@/modules/activos/composables/useActivoMutations'
import { useActivosQuery } from '@/modules/activos/composables/useActivosQuery'
import type {
  Activo,
  ActivoEstadoFiltro,
  ActivoFormMode,
  ActivoListFilters,
} from '@/modules/activos/interfaces/activo.interface'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { activosService } from '@/modules/activos/services/activos.service'
import {
  AppBadge,
  AppListToolbar,
  AppModal,
  AppPagination,
  AppSummaryChips,
  AppTable,
} from '@/shared/components'
import AppIcon from '@/shared/components/AppIcon.vue'
import AppDatePicker from '@/shared/components/form/AppDatePicker.vue'
import AppInput from '@/shared/components/form/AppInput.vue'
import { useOpenIdFromRouteQuery } from '@/shared/composables/useOpenIdFromRouteQuery'
import { ICONS } from '@/shared/constants/icons'
import { PermisoBanderas } from '@/shared/constants/permissions'
import { useListaOpcionesQuery } from '@/modules/catalogos/composables/useListaOpcionesQuery'
import { useSucursalesQuery } from '@/modules/configuracion/sucursales/composables/useSucursalesQuery'
import { ListaIds } from '@/shared/constants/lista-ids'
import type { DynamicFilterFieldDef, DynamicFilterValues } from '@/shared/interfaces/dynamic-filter.interface'
import type { SelectOption } from '@/shared/interfaces/form.interface'
import type { SummaryChip } from '@/shared/interfaces/summary-chip.interface'
import type { TableColumn } from '@/shared/interfaces/table.interface'
import { formatListaOpcionLabel } from '@/shared/utils/formatListaOpcion'

const authStore = useAuthStore()

const pageTitle = computed(() => 'Activos')
const breadcrumbItems = computed(() => [{ label: 'Gestión Empresa' }, { label: 'Activos' }])

const buscar = ref('')
const dynamicFilters = ref<DynamicFilterValues>({ estado: 'activos' })
const pagina = ref(1)
const limite = ref(10)
const fechaDesde = ref('')
const fechaHasta = ref('')
const importeMin = ref<number | undefined>(undefined)
const importeMax = ref<number | undefined>(undefined)

const estadoFiltroOptions: SelectOption[] = [
  { label: 'Todos', value: 'todos' },
  { label: 'Activos', value: 'activos' },
  { label: 'Inactivos', value: 'inactivos' },
]

const tipoQuery = useListaOpcionesQuery(computed(() => ListaIds.ACTIVOS_TIPO))
const tipoFilterOptions = computed<SelectOption[]>(
  () => tipoQuery.data.value?.map((o) => ({ value: o.id, label: o.nombre })) ?? [],
)

const sucursalesQuery = useSucursalesQuery(ref({ pagina: 1, limite: 200 }))
const sucursalFilterOptions = computed<SelectOption[]>(
  () => sucursalesQuery.data.value?.data?.map((s) => ({ value: s.id, label: s.nombre })) ?? [],
)

const filterFields = computed<DynamicFilterFieldDef[]>(() => [
  { key: 'estado', label: 'Estado', type: 'select', placeholder: 'Todos', options: estadoFiltroOptions },
  { key: 'idTipo', label: 'Tipo', type: 'select', placeholder: 'Todos', options: tipoFilterOptions.value },
  { key: 'idSucursal', label: 'Sucursal', type: 'select', placeholder: 'Todas', options: sucursalFilterOptions.value },
])

const estadoFiltroActual = computed<ActivoEstadoFiltro>(() => {
  const v = dynamicFilters.value.estado
  return v === 'activos' || v === 'inactivos' ? v : 'todos'
})

const buildEstado = (value: ActivoEstadoFiltro): number | undefined => {
  switch (value) {
    case 'activos':
      return 1
    case 'inactivos':
      return 0
    case 'todos':
    default:
      return undefined
  }
}

const filters = ref<ActivoListFilters>({
  buscar: '',
  pagina: 1,
  limite: 10,
  estado: 1,
  incluirImagenes: true,
})

const activosQuery = useActivosQuery(filters)
const deleteMutation = useDeleteActivoMutation()

const breakdownBase = computed<ActivoListFilters>(() => ({
  buscar: buscar.value.trim(),
  pagina: 1,
  limite: 1,
  incluirImagenes: false,
}))
const todosQuery = useActivosQuery(computed(() => ({ ...breakdownBase.value })))
const activosQueryCount = useActivosQuery(computed(() => ({ ...breakdownBase.value, estado: 1 })))
const inactivosQuery = useActivosQuery(computed(() => ({ ...breakdownBase.value, estado: 0 })))

const summaryChips = computed<SummaryChip[]>(() => [
  { label: 'Total activos', value: todosQuery.data.value?.meta?.total ?? 0, color: 'primary' },
  { label: 'Activos', value: activosQueryCount.data.value?.meta?.total ?? 0, color: 'success' },
  { label: 'Inactivos', value: inactivosQuery.data.value?.meta?.total ?? 0, color: 'error' },
])

const formModalOpen = ref(false)
const formMode = ref<ActivoFormMode>('create')
const selectedActivo = ref<Activo | null>(null)

const detailModalOpen = ref(false)
const activoToView = ref<Activo | null>(null)

const deleteModalOpen = ref(false)
const activoToDelete = ref<Activo | null>(null)

const currentUserId = computed(() => authStore.user?.id ?? null)

const canCreate = computed(() => authStore.hasPermission(PermisoBanderas.ACTIVO_CREAR))
const canEdit = computed(() => authStore.hasPermission(PermisoBanderas.ACTIVO_EDITAR))
const canDelete = computed(() => authStore.hasPermission(PermisoBanderas.ACTIVO_ELIMINAR))

const isLoading = computed(() => activosQuery.isFetching.value)
const rows = computed<Activo[]>(() => (activosQuery.data.value?.data ?? []) as Activo[])

const columns = computed<TableColumn<Activo>[]>(() => [
  { key: 'imagen', label: 'Img' },
  { key: 'descripcion', label: 'Descripción', cellClass: 'max-w-[18rem]' },
  { key: 'sucursal', label: 'Sucursal' },
  { key: 'marca_modelo', label: 'Marca / Modelo' },
  { key: 'numero_serie', label: 'N° Serie' },
  { key: 'fecha_compra', label: 'Compra' },
  { key: 'importe', label: 'Importe' },
  { key: 'estado', label: 'Estado' },
])

let buscarTimeout: ReturnType<typeof setTimeout> | undefined

watch(buscar, (value) => {
  clearTimeout(buscarTimeout)
  buscarTimeout = setTimeout(() => {
    pagina.value = 1
    filters.value = { ...filters.value, buscar: value.trim(), pagina: 1 }
  }, 350)
})

const onFiltersChange = () => {
  pagina.value = 1
  filters.value = {
    ...filters.value,
    estado: buildEstado(estadoFiltroActual.value),
    idTipo: dynamicFilters.value.idTipo as number | undefined,
    idSucursal: dynamicFilters.value.idSucursal as number | undefined,
    pagina: 1,
  }
}

const onExtraFilterChange = () => {
  filters.value = {
    ...filters.value,
    fechaDesde: fechaDesde.value || undefined,
    fechaHasta: fechaHasta.value || undefined,
    importeMin: importeMin.value ?? undefined,
    importeMax: importeMax.value ?? undefined,
    pagina: 1,
  }
}

watch([pagina, limite], () => {
  filters.value = { ...filters.value, pagina: pagina.value, limite: limite.value }
})

const openCreateModal = () => {
  formMode.value = 'create'
  selectedActivo.value = null
  formModalOpen.value = true
}

const openEditModal = (activo: Activo) => {
  formMode.value = 'edit'
  selectedActivo.value = activo
  formModalOpen.value = true
}

const openDetailModal = (activo: Activo) => {
  activoToView.value = activo
  detailModalOpen.value = true
}

useOpenIdFromRouteQuery({
  onOpen: async (id) => {
    try {
      const activo = await activosService.obtenerPorId(id)
      openDetailModal(activo)
    } catch {
      // sin permiso o no existe
    }
  },
})

const openDeleteModal = (activo: Activo) => {
  activoToDelete.value = activo
  deleteModalOpen.value = true
}

const confirmDelete = async () => {
  if (!activoToDelete.value || !currentUserId.value) return
  try {
    await deleteMutation.mutateAsync({
      id: activoToDelete.value.id,
      idUsuarioAuditoria: currentUserId.value,
    })
    deleteModalOpen.value = false
    activoToDelete.value = null
  } catch {
    // toast en mutation
  }
}

const onSaved = () => {
  selectedActivo.value = null
}
</script>
