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
          search-placeholder="Buscar por nombres, documento o brevete..."
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

      <template #cell-chofer="{ row }">
        <p class="truncate font-medium text-gray-800 dark:text-white/90">
          {{ getChoferNombre(row) }}
        </p>
        <p class="text-xs text-gray-500 dark:text-gray-400">
          {{ row.nombre_tipo_documento }} {{ row.numero_documento }}
        </p>
      </template>

      <template #cell-cliente="{ row }">
        <p class="truncate text-sm text-gray-700 dark:text-gray-300">
          {{ getClienteNombre(row) }}
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
          :meta="choferesQuery.data.value?.meta"
          :disabled="isLoading"
        />
      </template>
    </AppTable>

    <ChoferFormModal
      v-model="formModalOpen"
      :mode="formMode"
      :chofer="selectedChofer"
      :solo-empresa="soloEmpresa"
      :default-cliente-id="
        soloEmpresa ? null : idClienteFiltro ? Number(idClienteFiltro) : null
      "
      @saved="onChoferSaved"
    />

    <ChoferDetailModal v-model="detailModalOpen" :chofer="choferToView" />

    <AppModal
      v-model="deleteModalOpen"
      title="Eliminar chofer"
      subtitle="Esta acción desactivará al chofer en el sistema (baja lógica)."
      size="sm"
    >
      <p class="text-sm text-gray-600 dark:text-gray-400">
        ¿Confirmas que deseas eliminar a
        <span class="font-medium text-gray-800 dark:text-white/90">
          {{ choferToDelete ? getChoferNombre(choferToDelete) : '' }}
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
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import PageBreadcrumb from '@/modules/admin/components/PageBreadcrumb.vue'
import ChoferDetailModal from '@/modules/choferes/components/ChoferDetailModal.vue'
import ChoferFormModal from '@/modules/choferes/components/ChoferFormModal.vue'
import { useDeleteChoferMutation } from '@/modules/choferes/composables/useChoferMutations'
import { useChoferesQuery } from '@/modules/choferes/composables/useChoferesQuery'
import type {
  Chofer,
  ChoferEstadoFiltro,
  ChoferFormMode,
  ChoferListFilters,
} from '@/modules/choferes/interfaces/chofer.interface'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { choferesService } from '@/modules/choferes/services/choferes.service'
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

/** Sentinel API: id_cliente IS NULL (flota / cuentas de empresa). */
const ID_CLIENTE_EMPRESA = -1

const authStore = useAuthStore()
const route = useRoute()

const soloEmpresa = computed(() => Boolean(route.meta.soloEmpresa))
const pageTitle = computed(() =>
  soloEmpresa.value ? 'Choferes de la empresa' : 'Choferes',
)
const breadcrumbItems = computed(() =>
  soloEmpresa.value
    ? configuracionBreadcrumbItems('Choferes')
    : [
        { label: 'Clientes', to: '/admin/clientes' },
        { label: 'Choferes' },
      ],
)

const idClienteFiltro = ref<string | number>('')
const buscar = ref('')
const dynamicFilters = ref<DynamicFilterValues>({ estado: 'activos' })
const pagina = ref(1)
const limite = ref(10)

const estadoFiltroOptions: SelectOption[] = [
  { label: 'Todos', value: 'todos' },
  { label: 'Activos', value: 'activos' },
  { label: 'Inactivos', value: 'inactivos' },
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

const estadoFiltroActual = computed<ChoferEstadoFiltro>(() => {
  const v = dynamicFilters.value.estado
  return v === 'activos' || v === 'inactivos' ? v : 'todos'
})

const buildIsActivos = (value: ChoferEstadoFiltro): number | undefined => {
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

const filters = ref<ChoferListFilters>({
  buscar: '',
  pagina: 1,
  limite: 10,
  isActivos: 1,
  idCliente: soloEmpresa.value ? ID_CLIENTE_EMPRESA : undefined,
})

const choferesQuery = useChoferesQuery(filters)
const deleteMutation = useDeleteChoferMutation()

// --- Chips de resumen (total / activos / inactivos, respetando búsqueda y cliente) ---
const breakdownFiltersBase = computed<ChoferListFilters>(() => ({
  buscar: buscar.value.trim(),
  idCliente: soloEmpresa.value
    ? ID_CLIENTE_EMPRESA
    : idClienteFiltro.value
      ? Number(idClienteFiltro.value)
      : undefined,
  pagina: 1,
  limite: 1,
}))
const todosFilters = computed<ChoferListFilters>(() => ({ ...breakdownFiltersBase.value }))
const activosFilters = computed<ChoferListFilters>(() => ({ ...breakdownFiltersBase.value, isActivos: 1 }))
const inactivosFilters = computed<ChoferListFilters>(() => ({ ...breakdownFiltersBase.value, isActivos: 0 }))
const todosQuery = useChoferesQuery(todosFilters)
const activosQuery = useChoferesQuery(activosFilters)
const inactivosQuery = useChoferesQuery(inactivosFilters)

const summaryChips = computed<SummaryChip[]>(() => [
  // Antes usaba choferesQuery (la de la tabla, que respeta el filtro de Estado activo);
  // mismo defecto que en Clientes/Direcciones: "Total" mostraba solo el subconjunto filtrado.
  { label: 'Total choferes', value: todosQuery.data.value?.meta?.total ?? 0, color: 'primary' },
  { label: 'Activos', value: activosQuery.data.value?.meta?.total ?? 0, color: 'success' },
  { label: 'Inactivos', value: inactivosQuery.data.value?.meta?.total ?? 0, color: 'error' },
])

const formModalOpen = ref(false)
const formMode = ref<ChoferFormMode>('create')
const selectedChofer = ref<Chofer | null>(null)

const detailModalOpen = ref(false)
const choferToView = ref<Chofer | null>(null)

const deleteModalOpen = ref(false)
const choferToDelete = ref<Chofer | null>(null)

const currentUserId = computed(() => authStore.user?.id ?? null)

const canCreate = computed(() => authStore.hasPermission(PermisoBanderas.CHOFERES_CREAR))
const canEdit = computed(() => authStore.hasPermission(PermisoBanderas.CHOFERES_EDITAR))
const canDelete = computed(() => authStore.hasPermission(PermisoBanderas.CHOFERES_ELIMINAR))

const isLoading = computed(() => choferesQuery.isFetching.value)
const rows = computed(() => choferesQuery.data.value?.data ?? [])

const getChoferNombre = (chofer: Chofer) => {
  return [chofer.nombres, chofer.apellido_paterno, chofer.apellido_materno]
    .filter(Boolean)
    .join(' ')
    .trim()
}

const getClienteNombre = (chofer: Chofer) => {
  if (chofer.cliente_razon_social) {
    return chofer.cliente_razon_social
  }

  const nombreCompleto = [
    chofer.cliente_nombres,
    chofer.cliente_apellido_paterno,
    chofer.cliente_apellido_materno,
  ]
    .filter(Boolean)
    .join(' ')
    .trim()

  return nombreCompleto || chofer.cliente_numero_documento || 'Sin cliente asignado'
}

const columns = computed<TableColumn<Chofer>[]>(() => {
  const cols: TableColumn<Chofer>[] = [{ key: 'chofer', label: 'Chofer' }]
  if (!soloEmpresa.value) {
    cols.push({ key: 'cliente', label: 'Cliente / Proveedor' })
  }
  cols.push(
    { key: 'telefono', label: 'Teléfono' },
    { key: 'estado', label: 'Estado' },
  )
  return cols
})

let buscarTimeout: ReturnType<typeof setTimeout> | undefined

onMounted(() => {
  if (soloEmpresa.value) {
    filters.value = { ...filters.value, idCliente: ID_CLIENTE_EMPRESA }
    return
  }
  const idClienteQuery = route.query.idCliente
  if (idClienteQuery) {
    idClienteFiltro.value = Number(idClienteQuery)
  }
})

watch(idClienteFiltro, (value) => {
  if (soloEmpresa.value) return
  pagina.value = 1
  filters.value = {
    ...filters.value,
    idCliente: value ? Number(value) : undefined,
    pagina: 1,
  }
})

watch(buscar, (value) => {
  clearTimeout(buscarTimeout)
  buscarTimeout = setTimeout(() => {
    pagina.value = 1
    filters.value = {
      ...filters.value,
      buscar: value.trim(),
      pagina: 1,
    }
  }, 350)
})

const onFiltersChange = () => {
  pagina.value = 1
  filters.value = {
    ...filters.value,
    isActivos: buildIsActivos(estadoFiltroActual.value),
    pagina: 1,
  }
}

watch([pagina, limite], () => {
  filters.value = {
    ...filters.value,
    pagina: pagina.value,
    limite: limite.value,
  }
})

const openCreateModal = () => {
  formMode.value = 'create'
  selectedChofer.value = null
  formModalOpen.value = true
}

const openEditModal = (chofer: Chofer) => {
  formMode.value = 'edit'
  selectedChofer.value = chofer
  formModalOpen.value = true
}

const openDetailModal = (chofer: Chofer) => {
  choferToView.value = chofer
  detailModalOpen.value = true
}

useOpenIdFromRouteQuery({
  onOpen: async (id) => {
    try {
      const chofer = await choferesService.obtenerPorId(id)
      openDetailModal(chofer)
    } catch {
      // sin permiso o no existe
    }
  },
})

const openDeleteModal = (chofer: Chofer) => {
  choferToDelete.value = chofer
  deleteModalOpen.value = true
}

const confirmDelete = async () => {
  if (!choferToDelete.value || !currentUserId.value) return

  try {
    await deleteMutation.mutateAsync({
      id: choferToDelete.value.id,
      idUsuarioAuditoria: currentUserId.value,
    })
    deleteModalOpen.value = false
    choferToDelete.value = null
  } catch {
    // toast en mutation
  }
}

const onChoferSaved = () => {
  selectedChofer.value = null
}
</script>
