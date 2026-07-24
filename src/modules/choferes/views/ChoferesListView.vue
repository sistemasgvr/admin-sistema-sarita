<template>
  <div>
    <PageBreadcrumb page-title="Choferes" :items="breadcrumbItems" />

    <AppTable
      :columns="columns"
      :rows="rows"
      row-key="id"
      :loading="isLoading"
    >
      <template #toolbar>
        <div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div class="flex w-full flex-col gap-3 sm:flex-row sm:items-end">
            <!--  <div class="w-full sm:max-w-xs">
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
                placeholder="Buscar por nombres, documento o brevete..."
              />
            </div>

            <div class="w-full sm:w-60">
              <AppSelect v-model="mostrarChoferes" :options="estadoFiltroOptions" />
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
      :default-cliente-id="idClienteFiltro ? Number(idClienteFiltro) : null"
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
  { label: 'Flota' },
  { label: 'Choferes' },
]

const idClienteFiltro = ref<string | number>('')
const buscar = ref('')
const mostrarChoferes = ref<ChoferEstadoFiltro>('activos')
const pagina = ref(1)
const limite = ref(10)

const estadoFiltroOptions: SelectOption[] = [
  { label: 'Todos', value: 'todos' },
  { label: 'Activos', value: 'activos' },
  { label: 'Inactivos', value: 'inactivos' },
]

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
})

const choferesQuery = useChoferesQuery(filters)
const deleteMutation = useDeleteChoferMutation()

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

const columns = computed<TableColumn<Chofer>[]>(() => [
  { key: 'chofer', label: 'Chofer' },
  { key: 'cliente', label: 'Cliente / Proveedor' },
  { key: 'telefono', label: 'Teléfono' },
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

watch(mostrarChoferes, (value) => {
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
