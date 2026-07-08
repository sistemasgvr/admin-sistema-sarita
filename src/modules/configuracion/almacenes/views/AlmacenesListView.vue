<template>
  <div>
    <PageBreadcrumb page-title="Almacenes" />

    <AppTable
      :columns="columns"
      :rows="rows"
      row-key="id"
      :loading="isLoading"
    >
      <template #toolbar>
        <div class="flex flex-col gap-4">
          <div v-if="canCreate" class="flex justify-end">
            <button
              type="button"
              class="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white shadow-theme-xs transition hover:bg-brand-600"
              @click="openCreateModal"
            >
              <AppIcon :name="ICONS.plus" :size="18" />
              Nuevo almacén
            </button>
          </div>

          <div class="grid w-full gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div class="sm:col-span-2 lg:col-span-1">
              <AppInput
                v-model="buscar"
                label="Buscar"
                type="search"
                placeholder="Nombre o ubicación..."
              />
            </div>

            <AppSelect
              v-model="idSucursalFilter"
              label="Sucursal"
              placeholder="Todas"
              :options="sucursalFilterOptions"
              :disabled="isLoadingSucursales"
            />
          </div>
        </div>
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
          :meta="almacenesQuery.data.value?.meta"
          :disabled="isLoading"
        />
      </template>
    </AppTable>

    <AlmacenFormModal
      v-model="formModalOpen"
      :mode="formMode"
      :almacen="selectedAlmacen"
      @saved="onAlmacenSaved"
    />

    <AppModal
      v-model="deleteModalOpen"
      title="Eliminar almacén"
      subtitle="Esta acción desactivará el almacén en el sistema."
      size="sm"
    >
      <p class="text-sm text-gray-600 dark:text-gray-400">
        ¿Confirmas que deseas eliminar
        <span class="font-medium text-gray-800 dark:text-white/90">
          {{ almacenToDelete?.nombre }}
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
import PageBreadcrumb from '@/modules/admin/components/PageBreadcrumb.vue'
import AlmacenFormModal from '@/modules/configuracion/almacenes/components/AlmacenFormModal.vue'
import { useDeleteAlmacenMutation } from '@/modules/configuracion/almacenes/composables/useAlmacenMutations'
import { useAlmacenesQuery } from '@/modules/configuracion/almacenes/composables/useAlmacenesQuery'
import type {
  Almacen,
  AlmacenFormMode,
  AlmacenListFilters,
} from '@/modules/configuracion/almacenes/interfaces/almacen.interface'
import { sucursalesService } from '@/modules/configuracion/sucursales/services/sucursales.service'
import type { Sucursal } from '@/modules/configuracion/sucursales/interfaces/sucursal.interface'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { AppInput, AppModal, AppPagination, AppSelect, AppTable } from '@/shared/components'
import AppIcon from '@/shared/components/AppIcon.vue'
import { ICONS } from '@/shared/constants/icons'
import { PermisoBanderas } from '@/shared/constants/permissions'
import type { TableColumn } from '@/shared/interfaces/table.interface'

const authStore = useAuthStore()

const buscar = ref('')
const pagina = ref(1)
const limite = ref(10)
const idSucursalFilter = ref<string | number>('')

const filters = ref<AlmacenListFilters>({
  buscar: '',
  pagina: 1,
  limite: 10,
})

const almacenesQuery = useAlmacenesQuery(filters)
const deleteMutation = useDeleteAlmacenMutation()

const formModalOpen = ref(false)
const formMode = ref<AlmacenFormMode>('create')
const selectedAlmacen = ref<Almacen | null>(null)

const deleteModalOpen = ref(false)
const almacenToDelete = ref<Almacen | null>(null)

const isLoadingSucursales = ref(false)
const sucursales = ref<Sucursal[]>([])

const canCreate = computed(() => authStore.hasPermission(PermisoBanderas.ALMACENES_CREAR))
const canEdit = computed(() => authStore.hasPermission(PermisoBanderas.ALMACENES_EDITAR))
const canDelete = computed(() => authStore.hasPermission(PermisoBanderas.ALMACENES_ELIMINAR))

const isLoading = computed(() => almacenesQuery.isFetching.value)
const rows = computed(() => almacenesQuery.data.value?.data ?? [])

const sucursalFilterOptions = computed(() => [
  { value: '', label: 'Todas las sucursales' },
  ...sucursales.value.map((sucursal) => ({
    value: sucursal.id,
    label: sucursal.nombre,
  })),
])

const columns = computed<TableColumn<Almacen>[]>(() => [
  { key: 'nombre_sucursal', label: 'Sucursal' },
  { key: 'nombre', label: 'Nombre' },
  { key: 'ubicacion', label: 'Ubicación' },
  { key: 'descripcion', label: 'Descripción' },
])

const loadSucursales = async () => {
  isLoadingSucursales.value = true

  try {
    const result = await sucursalesService.listar({ pagina: 1, limite: 100 })
    sucursales.value = result.data
  } finally {
    isLoadingSucursales.value = false
  }
}

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

watch(idSucursalFilter, (value) => {
  pagina.value = 1
  filters.value = {
    ...filters.value,
    idSucursal: value ? Number(value) : undefined,
    pagina: 1,
  }
})

onMounted(() => {
  loadSucursales()
})

const openCreateModal = () => {
  formMode.value = 'create'
  selectedAlmacen.value = null
  formModalOpen.value = true
}

const openEditModal = (almacen: Almacen) => {
  formMode.value = 'edit'
  selectedAlmacen.value = almacen
  formModalOpen.value = true
}

const openDeleteModal = (almacen: Almacen) => {
  almacenToDelete.value = almacen
  deleteModalOpen.value = true
}

const confirmDelete = async () => {
  if (!almacenToDelete.value) return

  try {
    await deleteMutation.mutateAsync(almacenToDelete.value.id)
    deleteModalOpen.value = false
    almacenToDelete.value = null
  } catch {
    // toast en mutation
  }
}

const onAlmacenSaved = () => {
  selectedAlmacen.value = null
}
</script>
