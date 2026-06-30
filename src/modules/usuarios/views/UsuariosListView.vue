<template>
  <div>
    <PageBreadcrumb page-title="Usuarios" />

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
              placeholder="Buscar por nombre o correo..."
            />
          </div>

          <button
            v-if="canCreate"
            type="button"
            class="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white shadow-theme-xs transition hover:bg-brand-600"
            @click="openCreateModal"
          >
            <AppIcon :name="ICONS.plus" :size="18" />
            Nuevo usuario
          </button>
        </div>
      </template>

      <template #cell-roles="{ row }">
        <AppBadgeList :items="row.roles" empty-text="Sin roles" />
      </template>

      <template #actions="{ row }">
        <button
          v-if="canEdit"
          type="button"
          class="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm font-medium text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-500/10"
          @click="openEditModal(row)"
        >
          <AppIcon :name="ICONS.pencil" :size="16" />
          Editar
        </button>

        <button
          v-if="canDelete && row.id !== currentUserId"
          type="button"
          class="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm font-medium text-error-500 hover:bg-error-500/10"
          @click="openDeleteModal(row)"
        >
          <AppIcon :name="ICONS.trash" :size="16" />
          Eliminar
        </button>
      </template>

      <template #footer>
        <AppPagination
          v-model:pagina="pagina"
          v-model:limite="limite"
          :meta="usuariosQuery.data.value?.meta"
          :disabled="isLoading"
        />
      </template>
    </AppTable>

    <UsuarioFormModal
      v-model="formModalOpen"
      :mode="formMode"
      :usuario="selectedUsuario"
      @saved="onUsuarioSaved"
    />

    <AppModal
      v-model="deleteModalOpen"
      title="Eliminar usuario"
      subtitle="Esta acción desactivará el usuario en el sistema."
      size="sm"
    >
      <p class="text-sm text-gray-600 dark:text-gray-400">
        ¿Confirmas que deseas eliminar a
        <span class="font-medium text-gray-800 dark:text-white/90">
          {{ usuarioToDelete?.nombre }}
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
import UsuarioFormModal from '@/modules/usuarios/components/UsuarioFormModal.vue'
import { useDeleteUsuarioMutation } from '@/modules/usuarios/composables/useUsuarioMutations'
import { useUsuariosQuery } from '@/modules/usuarios/composables/useUsuariosQuery'
import type {
  Usuario,
  UsuarioFormMode,
  UsuarioListFilters,
} from '@/modules/usuarios/interfaces/usuario.interface'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import {
  AppBadgeList,
  AppInput,
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

const filters = ref<UsuarioListFilters>({
  buscar: '',
  pagina: 1,
  limite: 10,
})

const usuariosQuery = useUsuariosQuery(filters)
const deleteMutation = useDeleteUsuarioMutation()

const formModalOpen = ref(false)
const formMode = ref<UsuarioFormMode>('create')
const selectedUsuario = ref<Usuario | null>(null)

const deleteModalOpen = ref(false)
const usuarioToDelete = ref<Usuario | null>(null)

const currentUserId = computed(() => authStore.user?.id ?? null)
const canCreate = computed(() => authStore.hasPermission(PermisoBanderas.USUARIOS_CREAR))
const canEdit = computed(() => authStore.hasPermission(PermisoBanderas.USUARIOS_EDITAR))
const canDelete = computed(() => authStore.hasPermission(PermisoBanderas.USUARIOS_ELIMINAR))

const isLoading = computed(() => usuariosQuery.isFetching.value)

const rows = computed(() => usuariosQuery.data.value?.data ?? [])

const columns = computed<TableColumn<Usuario>[]>(() => [
  { key: 'nombre', label: 'Nombre' },
  { key: 'correo', label: 'Correo' },
  { key: 'roles', label: 'Roles' },
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
  selectedUsuario.value = null
  formModalOpen.value = true
}

const openEditModal = (usuario: Usuario) => {
  formMode.value = 'edit'
  selectedUsuario.value = usuario
  formModalOpen.value = true
}

const openDeleteModal = (usuario: Usuario) => {
  usuarioToDelete.value = usuario
  deleteModalOpen.value = true
}

const confirmDelete = async () => {
  if (!usuarioToDelete.value) return

  try {
    await deleteMutation.mutateAsync(usuarioToDelete.value.id)
    deleteModalOpen.value = false
    usuarioToDelete.value = null
  } catch {
    // toast en mutation
  }
}

const onUsuarioSaved = () => {
  selectedUsuario.value = null
}
</script>
