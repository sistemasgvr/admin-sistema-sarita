<template>
  <div>
    <PageBreadcrumb page-title="Condiciones de pago" />

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
              placeholder="Buscar por código o nombre..."
            />
          </div>

          <button
            v-if="canCreate"
            type="button"
            class="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white shadow-theme-xs transition hover:bg-brand-600"
            @click="openCreateModal"
          >
            <AppIcon :name="ICONS.plus" :size="18" />
            Nueva condición
          </button>
        </div>
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
          v-if="canDelete"
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
          :meta="condicionesPagoQuery.data.value?.meta"
          :disabled="isLoading"
        />
      </template>
    </AppTable>

    <CondicionPagoFormModal
      v-model="formModalOpen"
      :mode="formMode"
      :condicion-pago="selectedCondicionPago"
      @saved="onCondicionPagoSaved"
    />

    <AppModal
      v-model="deleteModalOpen"
      title="Eliminar condición de pago"
      subtitle="Esta acción desactivará la condición en el sistema."
      size="sm"
    >
      <p class="text-sm text-gray-600 dark:text-gray-400">
        ¿Confirmas que deseas eliminar
        <span class="font-medium text-gray-800 dark:text-white/90">
          {{ condicionPagoToDelete?.nombre }}
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
import CondicionPagoFormModal from '@/modules/configuracion/condiciones-pago/components/CondicionPagoFormModal.vue'
import { useDeleteCondicionPagoMutation } from '@/modules/configuracion/condiciones-pago/composables/useCondicionPagoMutations'
import { useCondicionesPagoQuery } from '@/modules/configuracion/condiciones-pago/composables/useCondicionesPagoQuery'
import type {
  CondicionPago,
  CondicionPagoFormMode,
  CondicionPagoListFilters,
} from '@/modules/configuracion/condiciones-pago/interfaces/condicion-pago.interface'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { AppInput, AppModal, AppPagination, AppTable } from '@/shared/components'
import AppIcon from '@/shared/components/AppIcon.vue'
import { ICONS } from '@/shared/constants/icons'
import { PermisoBanderas } from '@/shared/constants/permissions'
import type { TableColumn } from '@/shared/interfaces/table.interface'

const authStore = useAuthStore()

const buscar = ref('')
const pagina = ref(1)
const limite = ref(10)

const filters = ref<CondicionPagoListFilters>({
  buscar: '',
  pagina: 1,
  limite: 10,
})

const condicionesPagoQuery = useCondicionesPagoQuery(filters)
const deleteMutation = useDeleteCondicionPagoMutation()

const formModalOpen = ref(false)
const formMode = ref<CondicionPagoFormMode>('create')
const selectedCondicionPago = ref<CondicionPago | null>(null)

const deleteModalOpen = ref(false)
const condicionPagoToDelete = ref<CondicionPago | null>(null)

const canCreate = computed(() =>
  authStore.hasPermission(PermisoBanderas.CONDICIONES_PAGO_CREAR),
)
const canEdit = computed(() => authStore.hasPermission(PermisoBanderas.CONDICIONES_PAGO_EDITAR))
const canDelete = computed(() =>
  authStore.hasPermission(PermisoBanderas.CONDICIONES_PAGO_ELIMINAR),
)

const isLoading = computed(() => condicionesPagoQuery.isFetching.value)
const rows = computed(() => condicionesPagoQuery.data.value?.data ?? [])

const columns = computed<TableColumn<CondicionPago>[]>(() => [
  { key: 'codigo', label: 'Código' },
  { key: 'nombre', label: 'Nombre' },
  { key: 'dias_credito', label: 'Días crédito' },
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
  selectedCondicionPago.value = null
  formModalOpen.value = true
}

const openEditModal = (condicionPago: CondicionPago) => {
  formMode.value = 'edit'
  selectedCondicionPago.value = condicionPago
  formModalOpen.value = true
}

const openDeleteModal = (condicionPago: CondicionPago) => {
  condicionPagoToDelete.value = condicionPago
  deleteModalOpen.value = true
}

const confirmDelete = async () => {
  if (!condicionPagoToDelete.value) return

  try {
    await deleteMutation.mutateAsync(condicionPagoToDelete.value.id)
    deleteModalOpen.value = false
    condicionPagoToDelete.value = null
  } catch {
    // toast en mutation
  }
}

const onCondicionPagoSaved = () => {
  selectedCondicionPago.value = null
}
</script>
