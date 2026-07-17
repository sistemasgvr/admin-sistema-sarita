<template>
  <div>
    <PageBreadcrumb v-if="!embedded" page-title="Clientes" />

    <AppTable :columns="columns" :rows="rows" row-key="id" :loading="isLoading">
      <template #toolbar>
        <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div class="w-full sm:max-w-sm">
              <AppInput
                v-model="buscar"
                type="search"
                placeholder="Buscar por razón social, nombres o documento..."
              />
            </div>

            <div class="w-full sm:w-90">
              <AppSelect v-model="mostrarClientes" :options="estadoFiltroOptions" />
            </div>
          </div>

          <button
            v-if="canCreate"
            type="button"
            class="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white shadow-theme-xs transition hover:bg-brand-600"
            @click="openCreateModal"
          >
            <AppIcon :name="ICONS.plus" :size="18" />
            Nuevo
          </button>
        </div>
      </template>

      <template #cell-cliente="{ row }">
        <div class="flex flex-col gap-0.5">
          <p v-if="row.razon_social" class="truncate font-medium text-gray-800 dark:text-white/90">
            {{ row.razon_social }}
          </p>
          <p
            v-if="row.nombres || row.apellido_paterno || row.apellido_materno"
            class="truncate text-sm text-gray-500 dark:text-gray-400"
          >
            {{ [row.nombres, row.apellido_paterno, row.apellido_materno].filter(Boolean).join(' ') }}
          </p>
        </div>
        <AppBadge v-if="row.nombre_tipo_persona" size="sm" color="neutral" class="mt-1">
          {{ row.nombre_tipo_persona }}
        </AppBadge>
      </template>
      <template #cell-contacto="{ row }">
        <div class="flex flex-col text-sm">
          <span class="text-gray-500 dark:text-gray-400">
            tel: {{ row.telefono || '-' }}
          </span>

          <span class="text-gray-500 dark:text-gray-400">
            correo: {{ row.email || '-' }}
          </span>
        </div>
      </template>
      <template #cell-estado="{ row }">
        <AppBadge v-if="row.estado_baja_aprobacion" color="warning">
          Pendiente
        </AppBadge>
        <AppBadge v-else :color="row.estado === 1 ? 'success' : 'error'">
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
          v-if="canEdit && row.estado === 1"
          type="button"
          title="Solicitar baja"
          class="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm font-medium text-amber-600 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-500/10"
          @click="openBajaModal(row)"
        >
          <AppIcon :name="ICONS.archive" :size="16" />
        </button>

        <!-- <button
          v-if="canDelete && row.estado === 1"
          type="button"
          class="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm font-medium text-error-500 hover:bg-error-500/10"
          @click="openDeleteModal(row)"
        >
          <AppIcon :name="ICONS.trash" :size="16" />
        </button> -->

        <button
          v-if="canRestore && row.estado !== 1"
          type="button"
          class="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm font-medium text-success-600 hover:bg-success-500/10"
          :disabled="restaurarMutation.isPending.value"
          @click="restaurarCliente(row)"
        >
          <AppIcon :name="ICONS.check" :size="16" />
          Restaurar
        </button>
      </template>

      <template #footer>
        <AppPagination
          v-model:pagina="pagina"
          v-model:limite="limite"
          :meta="clientesQuery.data.value?.meta"
          :disabled="isLoading"
        />
      </template>
    </AppTable>

    <ClienteFormModal
      v-model="formModalOpen"
      :mode="formMode"
      :cliente="selectedCliente"
      @saved="onClienteSaved"
    />

    <ClienteDetailModal v-model="detailModalOpen" :cliente="clienteToView" />

    <ClienteBajaModal
      v-model="bajaModalOpen"
      :cliente="clienteToBaja"
      @saved="onBajaSaved"
    />

    <AppModal
      v-model="deleteModalOpen"
      title="Archivar cliente"
      subtitle="Esta acción desactivará el cliente en el sistema (baja lógica)."
      size="sm"
    >
      <p class="text-sm text-gray-600 dark:text-gray-400">
        ¿Confirmas que deseas archivar a
        <span class="font-medium text-gray-800 dark:text-white/90">
          {{ clienteToDelete ? getNombrePrincipal(clienteToDelete) : '' }}
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
          {{ deleteMutation.isPending.value ? 'Archivando...' : 'Archivar' }}
        </button>
      </template>
    </AppModal>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import PageBreadcrumb from '@/modules/admin/components/PageBreadcrumb.vue'
import ClienteBajaModal from '@/modules/clientes/bajas-cliente/components/ClienteBajaModal.vue'
import ClienteDetailModal from '@/modules/clientes/components/ClienteDetailModal.vue'
import ClienteFormModal from '@/modules/clientes/components/ClienteFormModal.vue'
import {
  useDeleteClienteMutation,
  useRestaurarClienteMutation,
} from '@/modules/clientes/composables/useClienteMutations'
import { useClientesQuery } from '@/modules/clientes/composables/useClientesQuery'
import type {
  Cliente,
  ClienteEstadoFiltro,
  ClienteFormMode,
  ClienteListFilters,
} from '@/modules/clientes/interfaces/cliente.interface'
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
import type { SelectOption } from '@/shared/interfaces/form.interface'
import type { TableColumn } from '@/shared/interfaces/table.interface'

withDefaults(
  defineProps<{
    embedded?: boolean
  }>(),
  {
    embedded: false,
  },
)

const authStore = useAuthStore()

const buscar = ref('')
const mostrarClientes = ref<ClienteEstadoFiltro>('activos')
const pagina = ref(1)
const limite = ref(10)

const estadoFiltroOptions: SelectOption[] = [
  { label: 'Todos', value: 'todos' },
  { label: 'Activos', value: 'activos' },
  { label: 'Inactivos', value: 'inactivos' },
]

const buildSoloActivos = (value: ClienteEstadoFiltro): number | undefined => {
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

const filters = ref<ClienteListFilters>({
  buscar: '',
  pagina: 1,
  limite: 10,
  soloActivos: 1,
})

const clientesQuery = useClientesQuery(filters)
const deleteMutation = useDeleteClienteMutation()
const restaurarMutation = useRestaurarClienteMutation()

const formModalOpen = ref(false)
const formMode = ref<ClienteFormMode>('create')
const selectedCliente = ref<Cliente | null>(null)

const detailModalOpen = ref(false)
const clienteToView = ref<Cliente | null>(null)

const deleteModalOpen = ref(false)
const clienteToDelete = ref<Cliente | null>(null)

const bajaModalOpen = ref(false)
const clienteToBaja = ref<Cliente | null>(null)

const currentUserId = computed(() => authStore.user?.id ?? null)

const canCreate = computed(() => authStore.hasPermission(PermisoBanderas.CLIENTES_CREAR))
const canEdit = computed(() => authStore.hasPermission(PermisoBanderas.CLIENTES_EDITAR))
const canDelete = computed(() => authStore.hasPermission(PermisoBanderas.CLIENTES_ELIMINAR))
const canRestore = computed(() => authStore.hasPermission(PermisoBanderas.CLIENTES_RESTAURAR))

const isLoading = computed(() => clientesQuery.isFetching.value)
const rows = computed(() => clientesQuery.data.value?.data ?? [])

const getNombrePrincipal = (cliente: Cliente) => {
  const esJuridica = cliente.nombre_tipo_persona?.toLowerCase().includes('jurí')

  if (esJuridica && cliente.razon_social) {
    return cliente.razon_social
  }

  const nombreCompleto = [cliente.nombres, cliente.apellido_paterno, cliente.apellido_materno]
    .filter(Boolean)
    .join(' ')
    .trim()

  return nombreCompleto || cliente.razon_social || cliente.numero_documento
}

const columns = computed<TableColumn<Cliente>[]>(() => [
  { key: 'cliente', label: 'Cliente' },
  { key: 'numero_documento', label: 'Documento' },
  { key: 'direccion', label: 'Dirección' },
  { key: 'contacto', label: 'Teléfono / Correo' },
  { key: 'estado', label: 'Estado' },
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

watch(mostrarClientes, (value) => {
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
  selectedCliente.value = null
  formModalOpen.value = true
}

const openEditModal = (cliente: Cliente) => {
  formMode.value = 'edit'
  selectedCliente.value = cliente
  formModalOpen.value = true
}

const openDetailModal = (cliente: Cliente) => {
  clienteToView.value = cliente
  detailModalOpen.value = true
}

const openDeleteModal = (cliente: Cliente) => {
  clienteToDelete.value = cliente
  deleteModalOpen.value = true
}

const openBajaModal = (cliente: Cliente) => {
  clienteToBaja.value = cliente
  bajaModalOpen.value = true
}

const onBajaSaved = () => {
  clienteToBaja.value = null
}

const confirmDelete = async () => {
  if (!clienteToDelete.value || !currentUserId.value) return

  try {
    await deleteMutation.mutateAsync({
      id: clienteToDelete.value.id,
      idUsuarioAuditoria: currentUserId.value,
    })
    deleteModalOpen.value = false
    clienteToDelete.value = null
  } catch {}
}

const restaurarCliente = async (cliente: Cliente) => {
  if (!currentUserId.value) return

  try {
    await restaurarMutation.mutateAsync({
      id: cliente.id,
      idUsuarioAuditoria: currentUserId.value,
    })
  } catch {}
}

const onClienteSaved = () => {
  selectedCliente.value = null
}
</script>
