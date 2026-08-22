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
          search-placeholder="Buscar por nombres o documento..."
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

      <template #cell-trabajador="{ row }">
        <p class="truncate font-medium text-gray-800 dark:text-white/90">
          {{ getTrabajadorNombre(row) }}
        </p>
        <p class="text-xs text-gray-500 dark:text-gray-400">
          {{ row.nombre_tipo_documento }} {{ row.numero_documento }}
        </p>
      </template>

      <template #cell-area_cargo="{ row }">
        <p class="truncate text-sm text-gray-700 dark:text-gray-300">{{ row.nombre_area || '—' }}</p>
        <p class="text-xs text-gray-500 dark:text-gray-400">{{ row.nombre_cargo || '—' }}</p>
      </template>

      <template #cell-edad="{ row }">
        <p class="text-sm text-gray-700 dark:text-gray-300">
          {{ row.edad != null ? `${row.edad} años` : '—' }}
        </p>
      </template>

      <template #cell-estado="{ row }">
        <AppBadge :color="row.estado === 1 ? 'success' : 'error'">
          {{ row.estado === 1 ? 'Activo' : 'Cesado' }}
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
          :meta="trabajadoresQuery.data.value?.meta"
          :disabled="isLoading"
        />
      </template>
    </AppTable>

    <TrabajadorFormModal
      v-model="formModalOpen"
      :mode="formMode"
      :trabajador="selectedTrabajador"
      @saved="onTrabajadorSaved"
    />

    <TrabajadorDetailModal v-model="detailModalOpen" :trabajador="trabajadorToView" />

    <AppModal
      v-model="deleteModalOpen"
      title="Dar de baja a trabajador"
      subtitle="Esta acción marcará al trabajador como cesado (baja lógica)."
      size="sm"
    >
      <p class="text-sm text-gray-600 dark:text-gray-400">
        ¿Confirmas que deseas dar de baja a
        <span class="font-medium text-gray-800 dark:text-white/90">
          {{ trabajadorToDelete ? getTrabajadorNombre(trabajadorToDelete) : '' }}
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
import TrabajadorDetailModal from '@/modules/trabajadores/components/TrabajadorDetailModal.vue'
import TrabajadorFormModal from '@/modules/trabajadores/components/TrabajadorFormModal.vue'
import {
  useDeleteTrabajadorMutation,
} from '@/modules/trabajadores/composables/useTrabajadorMutations'
import { useTrabajadoresQuery } from '@/modules/trabajadores/composables/useTrabajadoresQuery'
import type {
  Trabajador,
  TrabajadorEstadoFiltro,
  TrabajadorFormMode,
  TrabajadorListFilters,
} from '@/modules/trabajadores/interfaces/trabajador.interface'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { trabajadoresService } from '@/modules/trabajadores/services/trabajadores.service'
import {
  AppBadge,
  AppListToolbar,
  AppModal,
  AppPagination,
  AppSummaryChips,
  AppTable,
} from '@/shared/components'
import AppIcon from '@/shared/components/AppIcon.vue'
import { useOpenIdFromRouteQuery } from '@/shared/composables/useOpenIdFromRouteQuery'
import { ICONS } from '@/shared/constants/icons'
import { PermisoBanderas } from '@/shared/constants/permissions'
import { configuracionBreadcrumbItems } from '@/modules/configuracion/config/configuracion-breadcrumb'
import type { DynamicFilterFieldDef, DynamicFilterValues } from '@/shared/interfaces/dynamic-filter.interface'
import type { SelectOption } from '@/shared/interfaces/form.interface'
import type { SummaryChip } from '@/shared/interfaces/summary-chip.interface'
import type { TableColumn } from '@/shared/interfaces/table.interface'

const authStore = useAuthStore()

const pageTitle = computed(() => 'Trabajadores')
const breadcrumbItems = computed(() => configuracionBreadcrumbItems('Trabajadores'))

const buscar = ref('')
const dynamicFilters = ref<DynamicFilterValues>({ estado: 'activos' })
const pagina = ref(1)
const limite = ref(10)

const estadoFiltroOptions: SelectOption[] = [
  { label: 'Todos', value: 'todos' },
  { label: 'Activos', value: 'activos' },
  { label: 'Cesados', value: 'cesados' },
]

const filterFields = computed<DynamicFilterFieldDef[]>(() => [
  {
    key: 'estado',
    label: 'Estado',
    type: 'select',
    placeholder: 'Todos',
    options: estadoFiltroOptions,
  },
])

const estadoFiltroActual = computed<TrabajadorEstadoFiltro>(() => {
  const v = dynamicFilters.value.estado
  return v === 'activos' || v === 'cesados' ? v : 'todos'
})

const buildEstado = (value: TrabajadorEstadoFiltro): number | undefined => {
  switch (value) {
    case 'activos':
      return 1
    case 'cesados':
      return 0
    case 'todos':
    default:
      return undefined
  }
}

const filters = ref<TrabajadorListFilters>({
  buscar: '',
  pagina: 1,
  limite: 10,
  estado: 1,
})

const trabajadoresQuery = useTrabajadoresQuery(filters)
const deleteMutation = useDeleteTrabajadorMutation()

const breakdownFiltersBase = computed<TrabajadorListFilters>(() => ({
  buscar: buscar.value.trim(),
  pagina: 1,
  limite: 1,
}))
const todosQuery = useTrabajadoresQuery(computed(() => ({ ...breakdownFiltersBase.value })))
const activosQuery = useTrabajadoresQuery(computed(() => ({ ...breakdownFiltersBase.value, estado: 1 })))
const cesadosQuery = useTrabajadoresQuery(computed(() => ({ ...breakdownFiltersBase.value, estado: 0 })))

const summaryChips = computed<SummaryChip[]>(() => [
  { label: 'Total trabajadores', value: todosQuery.data.value?.meta?.total ?? 0, color: 'primary' },
  { label: 'Activos', value: activosQuery.data.value?.meta?.total ?? 0, color: 'success' },
  { label: 'Cesados', value: cesadosQuery.data.value?.meta?.total ?? 0, color: 'error' },
])

const formModalOpen = ref(false)
const formMode = ref<TrabajadorFormMode>('create')
const selectedTrabajador = ref<Trabajador | null>(null)

const detailModalOpen = ref(false)
const trabajadorToView = ref<Trabajador | null>(null)

const deleteModalOpen = ref(false)
const trabajadorToDelete = ref<Trabajador | null>(null)

const currentUserId = computed(() => authStore.user?.id ?? null)

const canCreate = computed(() => authStore.hasPermission(PermisoBanderas.TRABAJADOR_CREAR))
const canEdit = computed(() => authStore.hasPermission(PermisoBanderas.TRABAJADOR_EDITAR))
const canDelete = computed(() => authStore.hasPermission(PermisoBanderas.TRABAJADOR_ELIMINAR))

const isLoading = computed(() => trabajadoresQuery.isFetching.value)
const rows = computed(() => trabajadoresQuery.data.value?.data ?? [])

const getTrabajadorNombre = (trabajador: Trabajador) =>
  [trabajador.nombres, trabajador.apellido_paterno, trabajador.apellido_materno]
    .filter(Boolean)
    .join(' ')
    .trim()

const columns = computed<TableColumn<Trabajador>[]>(() => [
  { key: 'trabajador', label: 'Trabajador' },
  { key: 'area_cargo', label: 'Área / Cargo' },
  { key: 'edad', label: 'Edad' },
  { key: 'fecha_inicio', label: 'Inicio' },
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
  filters.value = { ...filters.value, estado: buildEstado(estadoFiltroActual.value), pagina: 1 }
}

watch([pagina, limite], () => {
  filters.value = { ...filters.value, pagina: pagina.value, limite: limite.value }
})

const openCreateModal = () => {
  formMode.value = 'create'
  selectedTrabajador.value = null
  formModalOpen.value = true
}

const openEditModal = (trabajador: Trabajador) => {
  formMode.value = 'edit'
  selectedTrabajador.value = trabajador
  formModalOpen.value = true
}

const openDetailModal = (trabajador: Trabajador) => {
  trabajadorToView.value = trabajador
  detailModalOpen.value = true
}

useOpenIdFromRouteQuery({
  onOpen: async (id) => {
    try {
      const trabajador = await trabajadoresService.obtenerPorId(id)
      openDetailModal(trabajador)
    } catch {
      // sin permiso o no existe
    }
  },
})

const openDeleteModal = (trabajador: Trabajador) => {
  trabajadorToDelete.value = trabajador
  deleteModalOpen.value = true
}

const confirmDelete = async () => {
  if (!trabajadorToDelete.value || !currentUserId.value) return

  try {
    await deleteMutation.mutateAsync({
      id: trabajadorToDelete.value.id,
      idUsuarioAuditoria: currentUserId.value,
    })
    deleteModalOpen.value = false
    trabajadorToDelete.value = null
  } catch {
    // toast en mutation
  }
}

const onTrabajadorSaved = () => {
  selectedTrabajador.value = null
}
</script>
