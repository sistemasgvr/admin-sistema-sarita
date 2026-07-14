<template>
  <div>
    <PageBreadcrumb page-title="Permisos" />

    <AppTable
      :columns="columns"
      :rows="rows"
      row-key="id"
      :loading="isLoading"
    >
      <template #toolbar>
        <AppListToolbar
          v-model:search="buscar"
          search-placeholder="Nombre o descripción..."
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

      <template #cell-nombre="{ row }">
        <AppBadge color="neutral">{{ row.nombre }}</AppBadge>
      </template>

      <template #actions="{ row }">
        <button
          v-if="canEdit"
          type="button"
          title="Editar"
          class="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm font-medium text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-500/10"
          @click="openEditModal(row)"
        >
          <AppIcon :name="ICONS.pencil" :size="16" />
          <!-- Editar -->
        </button>

        <button
          v-if="canDelete"
          type="button"
          title="Eliminar"
          class="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm font-medium text-error-500 hover:bg-error-500/10"
          @click="openDeleteModal(row)"
        >
          <AppIcon :name="ICONS.trash" :size="16" />
          <!-- Eliminar -->
        </button>
      </template>

      <template #footer>
        <AppPagination
          v-model:pagina="pagina"
          v-model:limite="limite"
          :meta="permisosQuery.data.value?.meta"
          :disabled="isLoading"
        />
      </template>
    </AppTable>

    <PermisoFormModal
      v-model="formModalOpen"
      :mode="formMode"
      :permiso="selectedPermiso"
      @saved="onPermisoSaved"
    />

    <AppModal
      v-model="deleteModalOpen"
      title="Eliminar permiso"
      subtitle="Esta acción desactivará el permiso en el sistema."
      size="sm"
    >
      <p class="text-sm text-gray-600 dark:text-gray-400">
        ¿Confirmas que deseas eliminar el permiso
        <span class="font-medium text-gray-800 dark:text-white/90">
          {{ permisoToDelete?.nombre }}
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
import PermisoFormModal from '@/modules/permisos/components/PermisoFormModal.vue'
import { useDeletePermisoMutation } from '@/modules/permisos/composables/usePermisoMutations'
import { usePermisosQuery } from '@/modules/permisos/composables/usePermisosQuery'
import type {
  Permiso,
  PermisoFormMode,
  PermisoListFilters,
} from '@/modules/permisos/interfaces/permiso.interface'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
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
import { formatDateTime } from '@/shared/utils/date'
import type { TableColumn } from '@/shared/interfaces/table.interface'

const authStore = useAuthStore()

const buscar = ref('')
const pagina = ref(1)
const limite = ref(10)

const filters = ref<PermisoListFilters>({
  buscar: '',
  pagina: 1,
  limite: 10,
})

const permisosQuery = usePermisosQuery(filters)
const deleteMutation = useDeletePermisoMutation()

const formModalOpen = ref(false)
const formMode = ref<PermisoFormMode>('create')
const selectedPermiso = ref<Permiso | null>(null)

const deleteModalOpen = ref(false)
const permisoToDelete = ref<Permiso | null>(null)

const canCreate = computed(() => authStore.hasPermission(PermisoBanderas.PERMISOS_CREAR))
const canEdit = computed(() => authStore.hasPermission(PermisoBanderas.PERMISOS_EDITAR))
const canDelete = computed(() => authStore.hasPermission(PermisoBanderas.PERMISOS_ELIMINAR))

const isLoading = computed(() => permisosQuery.isFetching.value)
const rows = computed(() => permisosQuery.data.value?.data ?? [])

const columns = computed<TableColumn<Permiso>[]>(() => [
  { key: 'nombre', label: 'Bandera' },
  { key: 'descripcion', label: 'Descripción' },
  { key: 'cantidad_roles', label: 'Roles' },
  {
    key: 'fecha_creacion',
    label: 'Creado',
    formatter: (value) => formatDateTime(value as string),
  },
])

let buscarTimeout: ReturnType<typeof setTimeout> | undefined

const syncFilters = () => {
  filters.value = {
    buscar: buscar.value.trim(),
    pagina: pagina.value,
    limite: limite.value,
  }
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
  selectedPermiso.value = null
  formModalOpen.value = true
}

const openEditModal = (permiso: Permiso) => {
  formMode.value = 'edit'
  selectedPermiso.value = permiso
  formModalOpen.value = true
}

const openDeleteModal = (permiso: Permiso) => {
  permisoToDelete.value = permiso
  deleteModalOpen.value = true
}

const confirmDelete = async () => {
  if (!permisoToDelete.value) return

  try {
    await deleteMutation.mutateAsync(permisoToDelete.value.id)
    deleteModalOpen.value = false
    permisoToDelete.value = null
  } catch {
    // toast en mutation
  }
}

const onPermisoSaved = () => {
  selectedPermiso.value = null
}
</script>
