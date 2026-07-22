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
        <AppListToolbar
          v-model:search="buscar"
          v-model:filters="dynamicFilters"
          :filter-fields="filterFields"
          search-placeholder="Nombre o correo..."
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

      <template #cell-estado="{ value }">
        <AppBadge
          v-if="value"
          variant="light"
          color="success"
        >
          Activo
        </AppBadge>
        <AppBadge
          v-else
          variant="light"
          color="error"
        >
          Desactivado
        </AppBadge>
      </template>

      <template #cell-roles="{ row }">
        <AppBadgeList :items="row.roles" empty-text="Sin roles" />
      </template>

      <template #actions="{ row }">
        <button
          v-if="canEdit && row.estado"
          type="button"
          title="Editar"
          class="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm font-medium text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-500/10"
          @click="openEditModal(row)"
        >
          <AppIcon :name="ICONS.pencil" :size="16" />
          <!-- Editar -->
        </button>

        <button
          v-if="canDeactivate && row.estado && row.id !== currentUserId"
          type="button"
          title="Desactivar"
          class="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm font-medium text-error-500 hover:bg-error-500/10"
          @click="openDeactivateModal(row)"
        >
          <AppIcon :name="ICONS.trash" :size="16" />
          <!-- Desactivar -->
        </button>

        <button
          v-if="canActivate && !row.estado"
          type="button"
          title="Activar"
          class="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm font-medium text-success-600 hover:bg-success-500/10"
          @click="openActivateModal(row)"
        >
          <AppIcon :name="ICONS.check" :size="16" />
        </button>

        <button
          v-if="canEdit && row.estado && row.id !== currentUserId"
          type="button"
          title="Solicitar desactivación"
          class="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm font-medium text-error-500 hover:bg-error-500/10"
          @click="openSolicitarDesactivacionModal(row)"
        >
          <AppIcon :name="ICONS.clock" :size="16" />
        </button>

        <button
          v-if="canEdit && !row.estado"
          type="button"
          title="Solicitar activación"
          class="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm font-medium text-success-600 hover:bg-success-500/10"
          @click="openSolicitarActivacionModal(row)"
        >
          <AppIcon :name="ICONS.clock" :size="16" />
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
      v-model="deactivateModalOpen"
      title="Desactivar usuario"
      subtitle="El usuario no podrá iniciar sesión hasta que sea activado nuevamente."
      size="sm"
    >
      <p class="text-sm text-gray-600 dark:text-gray-400">
        ¿Confirmas que deseas desactivar a
        <span class="font-medium text-gray-800 dark:text-white/90">
          {{ usuarioToDeactivate?.nombre }}
        </span>
        ?
      </p>

      <template #footer>
        <button
          type="button"
          class="flex w-full justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-white/[0.03] sm:w-auto"
          :disabled="deactivateMutation.isPending.value"
          @click="deactivateModalOpen = false"
        >
          Cancelar
        </button>
        <button
          type="button"
          class="flex w-full justify-center rounded-lg bg-error-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-error-600 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
          :disabled="deactivateMutation.isPending.value"
          @click="confirmDeactivate"
        >
          {{ deactivateMutation.isPending.value ? 'Desactivando...' : 'Desactivar' }}
        </button>
      </template>
    </AppModal>

    <AppModal
      v-model="activateModalOpen"
      title="Activar usuario"
      subtitle="El usuario podrá volver a iniciar sesión en el sistema."
      size="sm"
    >
      <p class="text-sm text-gray-600 dark:text-gray-400">
        ¿Confirmas que deseas activar a
        <span class="font-medium text-gray-800 dark:text-white/90">
          {{ usuarioToActivate?.nombre }}
        </span>
        ?
      </p>

      <template #footer>
        <button
          type="button"
          class="flex w-full justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-white/[0.03] sm:w-auto"
          :disabled="activateMutation.isPending.value"
          @click="activateModalOpen = false"
        >
          Cancelar
        </button>
        <button
          type="button"
          class="flex w-full justify-center rounded-lg bg-success-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-success-700 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
          :disabled="activateMutation.isPending.value"
          @click="confirmActivate"
        >
          {{ activateMutation.isPending.value ? 'Activando...' : 'Activar' }}
        </button>
      </template>
    </AppModal>

    <SolicitarActivacionModal
      v-model="solicitudModalOpen"
      :usuario="usuarioToSolicitud"
      :tipo-solicitud="solicitudTipo"
      @saved="onSolicitudSaved"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import PageBreadcrumb from '@/modules/admin/components/PageBreadcrumb.vue'
import UsuarioFormModal from '@/modules/usuarios/components/UsuarioFormModal.vue'
import SolicitarActivacionModal from '@/modules/usuarios/solicitudes/components/SolicitarActivacionModal.vue'
import type { TipoSolicitudUsuario } from '@/modules/usuarios/solicitudes/interfaces/solicitud-usuario.interface'
import {
  useActivarUsuarioMutation,
  useDesactivarUsuarioMutation,
} from '@/modules/usuarios/composables/useUsuarioMutations'
import { useUsuariosQuery } from '@/modules/usuarios/composables/useUsuariosQuery'
import type {
  Usuario,
  UsuarioEstadoFiltro,
  UsuarioFormMode,
  UsuarioListFilters,
} from '@/modules/usuarios/interfaces/usuario.interface'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import {
  AppBadge,
  AppBadgeList,
  AppListToolbar,
  AppModal,
  AppPagination,
  AppTable,
} from '@/shared/components'
import AppIcon from '@/shared/components/AppIcon.vue'
import { ICONS } from '@/shared/constants/icons'
import { PermisoBanderas } from '@/shared/constants/permissions'
import { formatDateTime } from '@/shared/utils/date'
import type { DynamicFilterFieldDef, DynamicFilterValues } from '@/shared/interfaces/dynamic-filter.interface'
import type { TableColumn } from '@/shared/interfaces/table.interface'

const authStore = useAuthStore()

const buscar = ref('')
const dynamicFilters = ref<DynamicFilterValues>({ estado: 'activos' })
const pagina = ref(1)
const limite = ref(10)

const filterFields = computed<DynamicFilterFieldDef[]>(() => [
  {
    key: 'estado',
    label: 'Estado',
    type: 'select',
    placeholder: 'Seleccionar estado',
    options: [
      { value: 'todos', label: 'Todos' },
      { value: 'activos', label: 'Activo' },
      { value: 'inactivos', label: 'Inactivo' },
    ],
  },
])

const filters = ref<UsuarioListFilters>({
  buscar: '',
  pagina: 1,
  limite: 10,
  estado: 'activos',
})

const usuariosQuery = useUsuariosQuery(filters)
const deactivateMutation = useDesactivarUsuarioMutation()
const activateMutation = useActivarUsuarioMutation()

const formModalOpen = ref(false)
const formMode = ref<UsuarioFormMode>('create')
const selectedUsuario = ref<Usuario | null>(null)

const deactivateModalOpen = ref(false)
const usuarioToDeactivate = ref<Usuario | null>(null)

const activateModalOpen = ref(false)
const usuarioToActivate = ref<Usuario | null>(null)

const solicitudModalOpen = ref(false)
const usuarioToSolicitud = ref<Usuario | null>(null)
const solicitudTipo = ref<TipoSolicitudUsuario>('ACTIVACION')

const currentUserId = computed(() => authStore.user?.id ?? null)
const canCreate = computed(() => authStore.hasPermission(PermisoBanderas.USUARIOS_CREAR))
const canEdit = computed(() => authStore.hasPermission(PermisoBanderas.USUARIOS_EDITAR))
const canDeactivate = computed(() => authStore.hasPermission(PermisoBanderas.USUARIOS_ELIMINAR))
const canActivate = computed(() => authStore.hasPermission(PermisoBanderas.USUARIOS_ACTIVAR))

const isLoading = computed(() => usuariosQuery.isFetching.value)

const rows = computed(() => usuariosQuery.data.value?.data ?? [])

const columns = computed<TableColumn<Usuario>[]>(() => [
  { key: 'nombre', label: 'Nombre' },
  { key: 'correo', label: 'Correo' },
  { key: 'estado', label: 'Estado' },
  { key: 'roles', label: 'Roles' },
  {
    key: 'fecha_creacion',
    label: 'Creado',
    formatter: (value) => formatDateTime(value as string),
  },
])

let buscarTimeout: ReturnType<typeof setTimeout> | undefined

const syncFilters = () => {
  const active = dynamicFilters.value

  filters.value = {
    buscar: buscar.value.trim(),
    pagina: pagina.value,
    limite: limite.value,
    estado: (active.estado as UsuarioEstadoFiltro | undefined) ?? 'activos',
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
  selectedUsuario.value = null
  formModalOpen.value = true
}

const openEditModal = (usuario: Usuario) => {
  formMode.value = 'edit'
  selectedUsuario.value = usuario
  formModalOpen.value = true
}

const openDeactivateModal = (usuario: Usuario) => {
  usuarioToDeactivate.value = usuario
  deactivateModalOpen.value = true
}

const openActivateModal = (usuario: Usuario) => {
  usuarioToActivate.value = usuario
  activateModalOpen.value = true
}

const openSolicitarActivacionModal = (usuario: Usuario) => {
  usuarioToSolicitud.value = usuario
  solicitudTipo.value = 'ACTIVACION'
  solicitudModalOpen.value = true
}

const openSolicitarDesactivacionModal = (usuario: Usuario) => {
  usuarioToSolicitud.value = usuario
  solicitudTipo.value = 'DESACTIVACION'
  solicitudModalOpen.value = true
}

const onSolicitudSaved = () => {
  usuarioToSolicitud.value = null
}

const confirmDeactivate = async () => {
  if (!usuarioToDeactivate.value) return

  try {
    await deactivateMutation.mutateAsync(usuarioToDeactivate.value.id)
    deactivateModalOpen.value = false
    usuarioToDeactivate.value = null
  } catch {
    // toast en mutation
  }
}

const confirmActivate = async () => {
  if (!usuarioToActivate.value) return

  try {
    await activateMutation.mutateAsync(usuarioToActivate.value.id)
    activateModalOpen.value = false
    usuarioToActivate.value = null
  } catch {
    // toast en mutation
  }
}

const onUsuarioSaved = () => {
  selectedUsuario.value = null
}
</script>
