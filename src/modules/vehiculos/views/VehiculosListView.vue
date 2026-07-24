<template>
  <div>
    <PageBreadcrumb page-title="Vehículos" :items="breadcrumbItems" />

    <AppTable
      :columns="columns"
      :rows="rows"
      row-key="id"
      :loading="isLoading"
    >
      <template #toolbar>
        <div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div class="flex w-full flex-col gap-3 sm:flex-row sm:items-end">
            <!-- <div class="w-full sm:max-w-xs">
              <AppSelect
                v-model="idClienteFiltro"
                label="Cliente / Proveedor"
                placeholder="Todos los clientes"
                :options="clienteFilterOptions"
              />
            </div>-->
            <div class="w-full sm:max-w-sm">
              <AppInput
                v-model="buscar"
                type="search"
                placeholder="Buscar por placa, marca o modelo..."
              />
            </div>

            <div class="w-full sm:w-60">
              <AppSelect v-model="mostrarVehiculos" :options="estadoFiltroOptions" />
            </div>
          </div>

          <button
            v-if="canCreate"
            type="button"
            class="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white shadow-theme-xs transition hover:bg-brand-600"
            @click="openCreateModal"
          >
            <AppIcon :name="ICONS.plus" :size="18" />
            Nuevo
          </button>
        </div>
      </template>

      <template #cell-vehiculo="{ row }">
        <p class="truncate font-medium text-gray-800 dark:text-white/90">
          {{ row.placa }}
        </p>
        <p class="text-xs text-gray-500 dark:text-gray-400">
          {{ [row.marca, row.modelo].filter(Boolean).join(' ') }}
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
          :meta="vehiculosQuery.data.value?.meta"
          :disabled="isLoading"
        />
      </template>
    </AppTable>

    <VehiculoFormModal
      v-model="formModalOpen"
      :mode="formMode"
      :vehiculo="selectedVehiculo"
      :default-cliente-id="idClienteFiltro ? Number(idClienteFiltro) : null"
      @saved="onVehiculoSaved"
    />

    <VehiculoDetailModal v-model="detailModalOpen" :vehiculo="vehiculoToView" />

    <AppModal
      v-model="deleteModalOpen"
      title="Eliminar vehículo"
      subtitle="Esta acción desactivará el vehículo en el sistema (baja lógica)."
      size="sm"
    >
      <p class="text-sm text-gray-600 dark:text-gray-400">
        ¿Confirmas que deseas eliminar el vehículo con placa
        <span class="font-medium text-gray-800 dark:text-white/90">
          {{ vehiculoToDelete?.placa }}
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
import VehiculoDetailModal from '@/modules/vehiculos/components/VehiculoDetailModal.vue'
import VehiculoFormModal from '@/modules/vehiculos/components/VehiculoFormModal.vue'
import { useDeleteVehiculoMutation } from '@/modules/vehiculos/composables/useVehiculoMutations'
import { useVehiculosQuery } from '@/modules/vehiculos/composables/useVehiculosQuery'
import type {
  Vehiculo,
  VehiculoEstadoFiltro,
  VehiculoFormMode,
  VehiculoListFilters,
} from '@/modules/vehiculos/interfaces/vehiculo.interface'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import {
  AppBadge,
  AppInput,
  AppModal,
  AppPagination,
  AppSelect,
  AppTable,
} from '@/shared/components'
import AppIcon from '@/shared/components/AppIcon.vue'
import { ICONS } from '@/shared/constants/icons'
import { PermisoBanderas } from '@/shared/constants/permissions'
import type { BreadcrumbItem } from '@/shared/interfaces/breadcrumb.interface'
import type { SelectOption } from '@/shared/interfaces/form.interface'
import type { TableColumn } from '@/shared/interfaces/table.interface'

const authStore = useAuthStore()
const route = useRoute()

const breadcrumbItems: BreadcrumbItem[] = [
  { label: 'Clientes', to: '/admin/clientes' },
  { label: 'Vehículos' },
]

const idClienteFiltro = ref<string | number>('')
const buscar = ref('')
const mostrarVehiculos = ref<VehiculoEstadoFiltro>('activos')
const pagina = ref(1)
const limite = ref(10)

const estadoFiltroOptions: SelectOption[] = [
  { label: 'Todos', value: 'todos' },
  { label: 'Activos', value: 'activos' },
  { label: 'Inactivos', value: 'inactivos' },
]

const buildIsActivos = (value: VehiculoEstadoFiltro): number | undefined => {
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

const filters = ref<VehiculoListFilters>({
  buscar: '',
  pagina: 1,
  limite: 10,
  isActivos: 1,
})

const vehiculosQuery = useVehiculosQuery(filters)
const deleteMutation = useDeleteVehiculoMutation()

const formModalOpen = ref(false)
const formMode = ref<VehiculoFormMode>('create')
const selectedVehiculo = ref<Vehiculo | null>(null)

const detailModalOpen = ref(false)
const vehiculoToView = ref<Vehiculo | null>(null)

const deleteModalOpen = ref(false)
const vehiculoToDelete = ref<Vehiculo | null>(null)

const currentUserId = computed(() => authStore.user?.id ?? null)

const canCreate = computed(() => authStore.hasPermission(PermisoBanderas.VEHICULOS_CREAR))
const canEdit = computed(() => authStore.hasPermission(PermisoBanderas.VEHICULOS_EDITAR))
const canDelete = computed(() => authStore.hasPermission(PermisoBanderas.VEHICULOS_ELIMINAR))

const isLoading = computed(() => vehiculosQuery.isFetching.value)
const rows = computed(() => vehiculosQuery.data.value?.data ?? [])

const getClienteNombre = (vehiculo: Vehiculo) => {
  if (vehiculo.cliente_razon_social) {
    return vehiculo.cliente_razon_social
  }

  const nombreCompleto = [
    vehiculo.cliente_nombres,
    vehiculo.cliente_apellido_paterno,
    vehiculo.cliente_apellido_materno,
  ]
    .filter(Boolean)
    .join(' ')
    .trim()

  return nombreCompleto || vehiculo.cliente_numero_documento || 'Sin cliente asignado'
}
const columns = computed<TableColumn<Vehiculo>[]>(() => [
  { key: 'vehiculo', label: 'Vehículo' },
  { key: 'cliente', label: 'Cliente / Proveedor' },
  { key: 'anio', label: 'Año' },
  { key: 'color', label: 'Color' },
  { key: 'estado', label: 'Estado' },
])

let buscarTimeout: ReturnType<typeof setTimeout> | undefined

onMounted(() => {
  const idClienteQuery = route.query.idCliente
  if (idClienteQuery) {
    idClienteFiltro.value = Number(idClienteQuery)
  }
})

watch(idClienteFiltro, (value) => {
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

watch(mostrarVehiculos, (value) => {
  pagina.value = 1
  filters.value = {
    ...filters.value,
    isActivos: buildIsActivos(value),
    pagina: 1,
  }
})

watch([pagina, limite], () => {
  filters.value = {
    ...filters.value,
    pagina: pagina.value,
    limite: limite.value,
  }
})

const openCreateModal = () => {
  formMode.value = 'create'
  selectedVehiculo.value = null
  formModalOpen.value = true
}

const openEditModal = (vehiculo: Vehiculo) => {
  formMode.value = 'edit'
  selectedVehiculo.value = vehiculo
  formModalOpen.value = true
}

const openDetailModal = (vehiculo: Vehiculo) => {
  vehiculoToView.value = vehiculo
  detailModalOpen.value = true
}

const openDeleteModal = (vehiculo: Vehiculo) => {
  vehiculoToDelete.value = vehiculo
  deleteModalOpen.value = true
}

const confirmDelete = async () => {
  if (!vehiculoToDelete.value || !currentUserId.value) return

  try {
    await deleteMutation.mutateAsync({
      id: vehiculoToDelete.value.id,
      idUsuarioAuditoria: currentUserId.value,
    })
    deleteModalOpen.value = false
    vehiculoToDelete.value = null
  } catch {
    // toast en mutation
  }
}

const onVehiculoSaved = () => {
  selectedVehiculo.value = null
}
</script>