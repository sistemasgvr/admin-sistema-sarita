<template>
  <div>
    <PageBreadcrumb page-title="Direcciones" :items="breadcrumbItems" />

    <AppTable :columns="columns" :rows="rows" row-key="id" :loading="isLoading">
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
            </div> -->

            <div class="w-full sm:max-w-sm">
              <AppInput
                v-model="buscar"
                type="search"
                placeholder="Buscar por dirección o descripción..."
              />
            </div>

            <div class="w-full sm:w-60">
              <AppSelect v-model="mostrarDirecciones" :options="estadoFiltroOptions" />
            </div>
          </div>

          <button
            v-if="canCreate"
            type="button"
            class="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white shadow-theme-xs transition hover:bg-brand-600"
            @click="openCreateModal"
          >
            <AppIcon :name="ICONS.plus" :size="18" />
            Nueva dirección
          </button>
        </div>
      </template>

      <template #cell-cliente="{ row }">
        <p class="truncate font-medium text-gray-800 dark:text-white/90">
          {{ getClienteNombre(row) }}
        </p>
        <p v-if="row.cliente_numero_documento" class="text-xs text-gray-500 dark:text-gray-400">
          {{ row.cliente_numero_documento }}
        </p>
      </template>

      <template #cell-direccion="{ row }">
        <p class="truncate font-medium text-gray-800 dark:text-white/90">
          {{ row.direccion }}
        </p>
        <p v-if="row.descripcion" class="text-xs text-gray-500 dark:text-gray-400">
          {{ row.descripcion }}
        </p>
        <AppBadge v-if="row.es_principal" size="sm" color="neutral" class="mt-1">
          Principal
        </AppBadge>
      </template>

      <template #cell-ubicacion="{ row }">
        <p class="text-sm text-gray-700 dark:text-gray-300">
          {{ getUbicacion(row) }}
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
          :meta="direccionesQuery.data.value?.meta"
          :disabled="isLoading"
        />
      </template>
    </AppTable>

    <DireccionFormModal
      v-model="formModalOpen"
      :mode="formMode"
      :direccion="selectedDireccion"
      :default-cliente-id="idClienteFiltro ? Number(idClienteFiltro) : null"
      :lock-cliente="false"
      @saved="onDireccionSaved"
    />

    <DireccionDetailModal v-model="detailModalOpen" :direccion="direccionToView" />

    <AppModal
      v-model="deleteModalOpen"
      title="Eliminar dirección"
      subtitle="Esta acción desactivará la dirección en el sistema (baja lógica)."
      size="sm"
    >
      <p class="text-sm text-gray-600 dark:text-gray-400">
        ¿Confirmas que deseas eliminar
        <span class="font-medium text-gray-800 dark:text-white/90">
          {{ direccionToDelete?.direccion }}
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
import DireccionDetailModal from '@/modules/direcciones/components/DireccionDetailModal.vue'
import DireccionFormModal from '@/modules/direcciones/components/DireccionFormModal.vue'
import { useDeleteDireccionMutation } from '@/modules/direcciones/composables/useDireccionMutations'
import { useDireccionesQuery } from '@/modules/direcciones/composables/useDireccionesQuery'
import type {
  Direccion,
  DireccionEstadoFiltro,
  DireccionFormMode,
  DireccionListFilters,
} from '@/modules/direcciones/interfaces/direccion.interface'
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
  { label: 'Direcciones' },
]

const idClienteFiltro = ref<string | number>('')
const buscar = ref('')
const mostrarDirecciones = ref<DireccionEstadoFiltro>('activos')
const pagina = ref(1)
const limite = ref(10)

const estadoFiltroOptions: SelectOption[] = [
  { label: 'Todos', value: 'todos' },
  { label: 'Activos', value: 'activos' },
  { label: 'Inactivos', value: 'inactivos' },
]

const buildSoloActivos = (value: DireccionEstadoFiltro): number | undefined => {
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

const filters = ref<DireccionListFilters>({
  buscar: '',
  pagina: 1,
  limite: 10,
  soloActivos: 1,
})

const direccionesQuery = useDireccionesQuery(filters)
const deleteMutation = useDeleteDireccionMutation()

const formModalOpen = ref(false)
const formMode = ref<DireccionFormMode>('create')
const selectedDireccion = ref<Direccion | null>(null)

const detailModalOpen = ref(false)
const direccionToView = ref<Direccion | null>(null)

const deleteModalOpen = ref(false)
const direccionToDelete = ref<Direccion | null>(null)

const currentUserId = computed(() => authStore.user?.id ?? null)

const canCreate = computed(() => authStore.hasPermission(PermisoBanderas.DIRECCIONES_CREAR))
const canEdit = computed(() => authStore.hasPermission(PermisoBanderas.DIRECCIONES_EDITAR))
const canDelete = computed(() => authStore.hasPermission(PermisoBanderas.DIRECCIONES_ELIMINAR))

const isLoading = computed(() => direccionesQuery.isFetching.value)
const rows = computed(() => direccionesQuery.data.value?.data ?? [])

const getClienteNombre = (direccion: Direccion) => {
  if (direccion.cliente_razon_social) {
    return direccion.cliente_razon_social
  }

  const nombreCompleto = [
    direccion.cliente_nombres,
    direccion.cliente_apellido_paterno,
    direccion.cliente_apellido_materno,
  ]
    .filter(Boolean)
    .join(' ')
    .trim()

  return nombreCompleto || direccion.cliente_numero_documento || '—'
}

const getUbicacion = (direccion: Direccion) => {
  return [
    direccion.nombre_distrito && `Distrito: ${direccion.nombre_distrito}`,
    direccion.nombre_provincia && `Provincia: ${direccion.nombre_provincia}`,
    direccion.nombre_departamento && `Departamento: ${direccion.nombre_departamento}`,
    direccion.nombre_pais && `País: ${direccion.nombre_pais}`,
  ]
    .filter(Boolean)
    .join(' | ')
}

const columns = computed<TableColumn<Direccion>[]>(() => [
  { key: 'cliente', label: 'Cliente / Proveedor' },
  { key: 'direccion', label: 'Dirección', class: 'max-width' },
  { key: 'ubicacion', label: 'Ubicación' },
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

watch(mostrarDirecciones, (value) => {
  pagina.value = 1
  filters.value = {
    ...filters.value,
    soloActivos: buildSoloActivos(value),
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
  selectedDireccion.value = null
  formModalOpen.value = true
}

const openEditModal = (direccion: Direccion) => {
  formMode.value = 'edit'
  selectedDireccion.value = direccion
  formModalOpen.value = true
}

const openDetailModal = (direccion: Direccion) => {
  direccionToView.value = direccion
  detailModalOpen.value = true
}

const openDeleteModal = (direccion: Direccion) => {
  direccionToDelete.value = direccion
  deleteModalOpen.value = true
}

const confirmDelete = async () => {
  if (!direccionToDelete.value || !currentUserId.value) return

  try {
    await deleteMutation.mutateAsync({
      id: direccionToDelete.value.id,
      idUsuarioAuditoria: currentUserId.value,
    })
    deleteModalOpen.value = false
    direccionToDelete.value = null
  } catch {
    // toast en mutation
  }
}

const onDireccionSaved = () => {
  selectedDireccion.value = null
}
</script>