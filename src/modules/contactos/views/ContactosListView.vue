<template>
  <div>
    <PageBreadcrumb page-title="Contactos" :items="breadcrumbItems" />

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
            </div> -->
            <div class="w-full sm:max-w-sm">
              <AppInput
                v-model="buscar"
                type="search"
                placeholder="Buscar por nombre, apellido o correo..."
              />
            </div>

            <div class="w-full sm:w-60">
              <AppSelect v-model="mostrarContactos" :options="estadoFiltroOptions" />
            </div>
          </div>

          <button
            v-if="canCreate"
            type="button"
            class="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white shadow-theme-xs transition hover:bg-brand-600"
            @click="openCreateModal"
          >
            <AppIcon :name="ICONS.plus" :size="18" />
            Nuevo contacto
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

      <template #cell-contacto="{ row }">
        <p class="truncate font-medium text-gray-800 dark:text-white/90">
          {{ getContactoNombre(row) }}
        </p>
        <AppBadge v-if="row.es_principal" size="sm" color="neutral" class="mt-1">
          Principal
        </AppBadge>
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
          :meta="contactosQuery.data.value?.meta"
          :disabled="isLoading"
        />
      </template>
    </AppTable>

    <ContactoFormModal
      v-model="formModalOpen"
      :mode="formMode"
      :contacto="selectedContacto"
      :default-cliente-id="idClienteFiltro ? Number(idClienteFiltro) : null"
      :lock-cliente="false"
      @saved="onContactoSaved"
    />

    <ContactoDetailModal v-model="detailModalOpen" :contacto="contactoToView" />

    <AppModal
      v-model="deleteModalOpen"
      title="Eliminar contacto"
      subtitle="Esta acción desactivará el contacto en el sistema (baja lógica)."
      size="sm"
    >
      <p class="text-sm text-gray-600 dark:text-gray-400">
        ¿Confirmas que deseas eliminar a
        <span class="font-medium text-gray-800 dark:text-white/90">
          {{ contactoToDelete ? getContactoNombre(contactoToDelete) : '' }}
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
import ContactoDetailModal from '@/modules/contactos/components/ContactoDetailModal.vue'
import ContactoFormModal from '@/modules/contactos/components/ContactoFormModal.vue'
import {
  useDeleteContactoMutation,
} from '@/modules/contactos/composables/useContactoMutations'
import { useContactosQuery } from '@/modules/contactos/composables/useContactosQuery'
import type {
  Contacto,
  ContactoEstadoFiltro,
  ContactoFormMode,
  ContactoListFilters,
} from '@/modules/contactos/interfaces/contacto.interface'
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
  { label: 'Contactos' },
]

const idClienteFiltro = ref<string | number>('')
const buscar = ref('')
const mostrarContactos = ref<ContactoEstadoFiltro>('activos')
const pagina = ref(1)
const limite = ref(10)

const estadoFiltroOptions: SelectOption[] = [
  { label: 'Todos', value: 'todos' },
  { label: 'Activos', value: 'activos' },
  { label: 'Inactivos', value: 'inactivos' },
]

const buildSoloActivos = (value: ContactoEstadoFiltro): number | undefined => {
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

const filters = ref<ContactoListFilters>({
  buscar: '',
  pagina: 1,
  limite: 10,
  soloActivos: 1,
})

const contactosQuery = useContactosQuery(filters)
const deleteMutation = useDeleteContactoMutation()

const formModalOpen = ref(false)
const formMode = ref<ContactoFormMode>('create')
const selectedContacto = ref<Contacto | null>(null)

const detailModalOpen = ref(false)
const contactoToView = ref<Contacto | null>(null)

const deleteModalOpen = ref(false)
const contactoToDelete = ref<Contacto | null>(null)

const canCreate = computed(() => authStore.hasPermission(PermisoBanderas.CONTACTOS_CREAR))
const canEdit = computed(() => authStore.hasPermission(PermisoBanderas.CONTACTOS_EDITAR))
const canDelete = computed(() => authStore.hasPermission(PermisoBanderas.CONTACTOS_ELIMINAR))

const isLoading = computed(() => contactosQuery.isFetching.value)
const rows = computed(() => contactosQuery.data.value?.data ?? [])

const getClienteNombre = (contacto: Contacto) => {
  if (contacto.cliente_razon_social) {
    return contacto.cliente_razon_social
  }

  const nombreCompleto = [
    contacto.cliente_nombres,
    contacto.cliente_apellido_paterno,
    contacto.cliente_apellido_materno,
  ]
    .filter(Boolean)
    .join(' ')
    .trim()

  return nombreCompleto || contacto.cliente_numero_documento || '—'
}

const getContactoNombre = (contacto: Contacto) => {
  return [contacto.nombre, contacto.apellido_paterno, contacto.apellido_materno]
    .filter(Boolean)
    .join(' ')
    .trim()
}

const columns = computed<TableColumn<Contacto>[]>(() => [
  { key: 'cliente', label: 'Cliente / Proveedor' },
  { key: 'contacto', label: 'Contacto' },
  { key: 'direccion', label: 'Dirección' },
  { key: 'telefono1', label: 'Teléfono' },
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

watch(mostrarContactos, (value) => {
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
  selectedContacto.value = null
  formModalOpen.value = true
}

const openEditModal = (contacto: Contacto) => {
  formMode.value = 'edit'
  selectedContacto.value = contacto
  formModalOpen.value = true
}

const openDetailModal = (contacto: Contacto) => {
  contactoToView.value = contacto
  detailModalOpen.value = true
}

const openDeleteModal = (contacto: Contacto) => {
  contactoToDelete.value = contacto
  deleteModalOpen.value = true
}

const confirmDelete = async () => {
  if (!contactoToDelete.value) return

  try {
    await deleteMutation.mutateAsync(contactoToDelete.value.id)
    deleteModalOpen.value = false
    contactoToDelete.value = null
  } catch {
    // toast en mutation
  }
}

const onContactoSaved = () => {
  selectedContacto.value = null
}
</script>