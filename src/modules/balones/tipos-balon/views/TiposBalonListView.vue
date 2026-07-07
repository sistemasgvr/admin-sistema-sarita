<template>
  <div>
    <PageBreadcrumb page-title="Tipos de balón" :items="breadcrumbItems" />

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
              placeholder="Buscar por nombre o gas..."
            />
          </div>

          <button
            v-if="canCreate"
            type="button"
            class="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white shadow-theme-xs transition hover:bg-brand-600"
            @click="openCreateModal"
          >
            <AppIcon :name="ICONS.plus" :size="18" />
            Nuevo tipo
          </button>
        </div>
      </template>

      <template #cell-capacidad="{ row }">
        <span v-if="row.capacidad != null">
          {{ row.capacidad }}
          <span v-if="row.nombre_unidad_medida" class="text-gray-400">
            {{ row.nombre_unidad_medida }}
          </span>
        </span>
        <span v-else class="text-gray-400">—</span>
      </template>

      <template #cell-peso="{ value }">
        <span v-if="value != null">{{ value }} kg</span>
        <span v-else class="text-gray-400">—</span>
      </template>

      <template #cell-total_balones="{ value }">
        <AppBadge variant="light" :color="Number(value ?? 0) > 0 ? 'primary' : undefined">
          {{ value ?? 0 }}
        </AppBadge>
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
          :meta="tiposBalonQuery.data.value?.meta"
          :disabled="isLoading"
        />
      </template>
    </AppTable>

    <TipoBalonFormModal
      v-model="formModalOpen"
      :mode="formMode"
      :tipo-balon="selectedTipoBalon"
      @saved="onTipoBalonSaved"
    />

    <AppModal
      v-model="deleteModalOpen"
      title="Eliminar tipo de balón"
      subtitle="No se puede eliminar si tiene cilindros activos asociados."
      size="sm"
    >
      <p class="text-sm text-gray-600 dark:text-gray-400">
        ¿Confirmas que deseas eliminar
        <span class="font-medium text-gray-800 dark:text-white/90">
          {{ tipoBalonToDelete?.nombre }}
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
import TipoBalonFormModal from '@/modules/balones/tipos-balon/components/TipoBalonFormModal.vue'
import { useDeleteTipoBalonMutation } from '@/modules/balones/tipos-balon/composables/useTipoBalonMutations'
import { useTiposBalonQuery } from '@/modules/balones/tipos-balon/composables/useTiposBalonQuery'
import { balonesBreadcrumbItems } from '@/modules/balones/config/balones-breadcrumb'
import type {
  TipoBalon,
  TipoBalonFormMode,
  TipoBalonListFilters,
} from '@/modules/balones/tipos-balon/interfaces/tipo-balon.interface'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { AppBadge, AppInput, AppModal, AppPagination, AppTable } from '@/shared/components'
import AppIcon from '@/shared/components/AppIcon.vue'
import { ICONS } from '@/shared/constants/icons'
import { PermisoBanderas } from '@/shared/constants/permissions'
import type { TableColumn } from '@/shared/interfaces/table.interface'

const authStore = useAuthStore()

const buscar = ref('')
const pagina = ref(1)
const limite = ref(10)

const filters = ref<TipoBalonListFilters>({
  buscar: '',
  pagina: 1,
  limite: 10,
})

const tiposBalonQuery = useTiposBalonQuery(filters)
const deleteMutation = useDeleteTipoBalonMutation()

const formModalOpen = ref(false)
const formMode = ref<TipoBalonFormMode>('create')
const selectedTipoBalon = ref<TipoBalon | null>(null)

const deleteModalOpen = ref(false)
const tipoBalonToDelete = ref<TipoBalon | null>(null)

const breadcrumbItems = computed(() => balonesBreadcrumbItems('Tipos de balón'))

const canCreate = computed(() => authStore.hasPermission(PermisoBanderas.TIPOS_BALON_CREAR))
const canEdit = computed(() => authStore.hasPermission(PermisoBanderas.TIPOS_BALON_EDITAR))
const canDelete = computed(() => authStore.hasPermission(PermisoBanderas.TIPOS_BALON_ELIMINAR))

const isLoading = computed(() => tiposBalonQuery.isFetching.value)
const rows = computed(() => tiposBalonQuery.data.value?.data ?? [])

const columns = computed<TableColumn<TipoBalon>[]>(() => [
  { key: 'nombre', label: 'Nombre' },
  { key: 'nombre_gas', label: 'Gas' },
  { key: 'capacidad', label: 'Capacidad' },
  { key: 'peso', label: 'Peso tara', cellClass: 'whitespace-nowrap' },
  { key: 'total_balones', label: 'Cilindros' },
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
  selectedTipoBalon.value = null
  formModalOpen.value = true
}

const openEditModal = (tipoBalon: TipoBalon) => {
  formMode.value = 'edit'
  selectedTipoBalon.value = tipoBalon
  formModalOpen.value = true
}

const openDeleteModal = (tipoBalon: TipoBalon) => {
  tipoBalonToDelete.value = tipoBalon
  deleteModalOpen.value = true
}

const confirmDelete = async () => {
  const currentUserId = authStore.user?.id
  if (!tipoBalonToDelete.value || !currentUserId) return

  try {
    await deleteMutation.mutateAsync({
      id: tipoBalonToDelete.value.id,
      idUsuarioAuditoria: currentUserId,
    })
    deleteModalOpen.value = false
    tipoBalonToDelete.value = null
  } catch {
    // toast en mutation
  }
}

const onTipoBalonSaved = () => {
  selectedTipoBalon.value = null
}
</script>
