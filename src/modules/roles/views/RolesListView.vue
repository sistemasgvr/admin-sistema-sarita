<template>
  <div>
    <PageBreadcrumb page-title="Roles" />

    <AppTable
      :columns="columns"
      :rows="rows"
      row-key="id"
      :loading="isLoading"
    >
      <template #toolbar>
        <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div class="w-full sm:max-w-sm">
            <AppInput
              v-model="buscar"
              type="search"
              placeholder="Buscar por nombre o descripción..."
            />
          </div>

          <button
            v-if="canCreate"
            type="button"
            class="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white shadow-theme-xs transition hover:bg-brand-600"
            @click="openCreateModal"
          >
            <AppIcon :name="ICONS.plus" :size="18" />
            Nuevo rol
          </button>
        </div>
      </template>

      <template #actions="{ row }">
        <button
          v-if="canManagePermisos"
          type="button"
          title="Permisos"
          class="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/[0.05]"
          @click="openPermisosModal(row)"
        >
          <AppIcon :name="ICONS.keyRound" :size="16" />
          <!-- Permisos -->
        </button>

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
          :meta="rolesQuery.data.value?.meta"
          :disabled="isLoading"
        />
      </template>
    </AppTable>

    <RolFormModal
      v-model="formModalOpen"
      :mode="formMode"
      :rol="selectedRol"
      @saved="onRolSaved"
    />

    <RolPermisosModal
      v-model="permisosModalOpen"
      :rol="rolPermisos"
      @saved="onPermisosSaved"
    />

    <AppModal
      v-model="deleteModalOpen"
      title="Eliminar rol"
      subtitle="Esta acción desactivará el rol en el sistema."
      size="sm"
    >
      <p class="text-sm text-gray-600 dark:text-gray-400">
        ¿Confirmas que deseas eliminar el rol
        <span class="font-medium text-gray-800 dark:text-white/90">
          {{ rolToDelete?.nombre }}
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
import RolFormModal from '@/modules/roles/components/RolFormModal.vue'
import RolPermisosModal from '@/modules/roles/components/RolPermisosModal.vue'
import { useDeleteRolMutation } from '@/modules/roles/composables/useRolMutations'
import { useRolesQuery } from '@/modules/roles/composables/useRolesQuery'
import type { Rol, RolFormMode, RolListFilters } from '@/modules/roles/interfaces/rol.interface'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { AppInput, AppModal, AppPagination, AppTable } from '@/shared/components'
import AppIcon from '@/shared/components/AppIcon.vue'
import { ICONS } from '@/shared/constants/icons'
import { PermisoBanderas } from '@/shared/constants/permissions'
import { formatDateTime } from '@/shared/utils/date'
import type { TableColumn } from '@/shared/interfaces/table.interface'

const authStore = useAuthStore()

const buscar = ref('')
const pagina = ref(1)
const limite = ref(10)

const filters = ref<RolListFilters>({
  buscar: '',
  pagina: 1,
  limite: 10,
})

const rolesQuery = useRolesQuery(filters)
const deleteMutation = useDeleteRolMutation()

const formModalOpen = ref(false)
const permisosModalOpen = ref(false)
const formMode = ref<RolFormMode>('create')
const selectedRol = ref<Rol | null>(null)
const rolPermisos = ref<Rol | null>(null)

const deleteModalOpen = ref(false)
const rolToDelete = ref<Rol | null>(null)

const canCreate = computed(() => authStore.hasPermission(PermisoBanderas.ROLES_CREAR))
const canEdit = computed(() => authStore.hasPermission(PermisoBanderas.ROLES_EDITAR))
const canDelete = computed(() => authStore.hasPermission(PermisoBanderas.ROLES_ELIMINAR))
const canManagePermisos = computed(() =>
  authStore.hasPermission(PermisoBanderas.ROLES_PERMISOS_LISTAR),
)

const isLoading = computed(() => rolesQuery.isFetching.value)
const rows = computed(() => rolesQuery.data.value?.data ?? [])

const columns = computed<TableColumn<Rol>[]>(() => [
  { key: 'nombre', label: 'Nombre' },
  { key: 'descripcion', label: 'Descripción' },
  { key: 'cantidad_permisos', label: 'Permisos' },
  { key: 'cantidad_usuarios', label: 'Usuarios' },
  {
    key: 'fecha_creacion',
    label: 'Creado',
    formatter: (value) => formatDateTime(value as string),
  },
])

let buscarTimeout: ReturnType<typeof setTimeout> | undefined

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

watch([pagina, limite], () => {
  filters.value = {
    ...filters.value,
    pagina: pagina.value,
    limite: limite.value,
  }
})

const openCreateModal = () => {
  formMode.value = 'create'
  selectedRol.value = null
  formModalOpen.value = true
}

const openEditModal = (rol: Rol) => {
  formMode.value = 'edit'
  selectedRol.value = rol
  formModalOpen.value = true
}

const openPermisosModal = (rol: Rol) => {
  rolPermisos.value = rol
  permisosModalOpen.value = true
}

const openDeleteModal = (rol: Rol) => {
  rolToDelete.value = rol
  deleteModalOpen.value = true
}

const confirmDelete = async () => {
  if (!rolToDelete.value) return

  try {
    await deleteMutation.mutateAsync(rolToDelete.value.id)
    deleteModalOpen.value = false
    rolToDelete.value = null
  } catch {
    // toast en mutation
  }
}

const onRolSaved = () => {
  selectedRol.value = null
}

const onPermisosSaved = () => {
  rolPermisos.value = null
}
</script>
