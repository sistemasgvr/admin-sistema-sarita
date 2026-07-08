<template>
  <div>
    <PageBreadcrumb page-title="Categorías" :items="breadcrumbItems" />

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
              Nueva categoría
            </button>
          </div>

          <div class="grid w-full gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div class="sm:col-span-2 lg:col-span-1">
              <AppInput
                v-model="buscar"
                label="Buscar"
                type="search"
                placeholder="Nombre o descripción..."
              />
            </div>
          </div>
        </div>
      </template>

      <template #cell-total_sub_categorias="{ row, value }">
        <button
          v-if="canManageSubCategorias"
          type="button"
          class="inline-flex"
          @click="openSubcategoriasModal(row)"
        >
          <AppBadge variant="light" :color="Number(value ?? 0) > 0 ? 'primary' : undefined">
            {{ value ?? 0 }}
          </AppBadge>
        </button>
        <AppBadge v-else variant="light">{{ value ?? 0 }}</AppBadge>
      </template>

      <template #actions="{ row }">
        <button
          v-if="canManageSubCategorias"
          type="button"
          title="Subcategorías"
          class="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5"
          @click="openSubcategoriasModal(row)"
        >
          <AppIcon :name="ICONS.listTree" :size="16" />
          <!-- Subcategorías -->
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
          :meta="categoriasQuery.data.value?.meta"
          :disabled="isLoading"
        />
      </template>
    </AppTable>

    <CategoriaProductoFormModal
      v-model="formModalOpen"
      :mode="formMode"
      :categoria="selectedCategoria"
      @saved="onCategoriaSaved"
    />

    <CategoriaSubcategoriasModal
      v-model="subcategoriasModalOpen"
      :categoria="categoriaForSubcategorias"
      @changed="onSubcategoriasChanged"
    />

    <AppModal
      v-model="deleteModalOpen"
      title="Eliminar categoría"
      subtitle="No se puede eliminar si tiene subcategorías activas."
      size="sm"
    >
      <p class="text-sm text-gray-600 dark:text-gray-400">
        ¿Confirmas que deseas eliminar
        <span class="font-medium text-gray-800 dark:text-white/90">
          {{ categoriaToDelete?.nombre }}
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
import CategoriaSubcategoriasModal from '@/modules/productos/categorias/components/CategoriaSubcategoriasModal.vue'
import CategoriaProductoFormModal from '@/modules/productos/categorias/components/CategoriaProductoFormModal.vue'
import { useDeleteCategoriaProductoMutation } from '@/modules/productos/categorias/composables/useCategoriaProductoMutations'
import { useCategoriasProductoQuery } from '@/modules/productos/categorias/composables/useCategoriasProductoQuery'
import { productosBreadcrumbItems } from '@/modules/productos/config/productos-breadcrumb'
import type {
  CategoriaProducto,
  CategoriaProductoFormMode,
  CategoriaProductoListFilters,
} from '@/modules/productos/categorias/interfaces/categoria-producto.interface'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { AppBadge, AppInput, AppModal, AppPagination, AppTable } from '@/shared/components'
import AppIcon from '@/shared/components/AppIcon.vue'
import { ICONS } from '@/shared/constants/icons'
import { PermisoBanderas } from '@/shared/constants/permissions'
import type { TableColumn } from '@/shared/interfaces/table.interface'

const authStore = useAuthStore()
const breadcrumbItems = productosBreadcrumbItems('Categorías')

const buscar = ref('')
const pagina = ref(1)
const limite = ref(10)

const filters = ref<CategoriaProductoListFilters>({
  buscar: '',
  pagina: 1,
  limite: 10,
})

const categoriasQuery = useCategoriasProductoQuery(filters)
const deleteMutation = useDeleteCategoriaProductoMutation()

const formModalOpen = ref(false)
const formMode = ref<CategoriaProductoFormMode>('create')
const selectedCategoria = ref<CategoriaProducto | null>(null)

const subcategoriasModalOpen = ref(false)
const categoriaForSubcategorias = ref<CategoriaProducto | null>(null)

const deleteModalOpen = ref(false)
const categoriaToDelete = ref<CategoriaProducto | null>(null)

const canCreate = computed(() => authStore.hasPermission(PermisoBanderas.CATEGORIAS_CREAR))
const canEdit = computed(() => authStore.hasPermission(PermisoBanderas.CATEGORIAS_EDITAR))
const canDelete = computed(() => authStore.hasPermission(PermisoBanderas.CATEGORIAS_ELIMINAR))
const canManageSubCategorias = computed(() =>
  authStore.hasPermission(PermisoBanderas.SUB_CATEGORIAS_LISTAR),
)

const isLoading = computed(() => categoriasQuery.isFetching.value)
const rows = computed(() => categoriasQuery.data.value?.data ?? [])

const columns = computed<TableColumn<CategoriaProducto>[]>(() => [
  { key: 'nombre', label: 'Nombre' },
  { key: 'descripcion', label: 'Descripción' },
  { key: 'total_sub_categorias', label: 'Subcategorías' },
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
  selectedCategoria.value = null
  formModalOpen.value = true
}

const openEditModal = (categoria: CategoriaProducto) => {
  formMode.value = 'edit'
  selectedCategoria.value = categoria
  formModalOpen.value = true
}

const openSubcategoriasModal = (categoria: CategoriaProducto) => {
  categoriaForSubcategorias.value = categoria
  subcategoriasModalOpen.value = true
}

const openDeleteModal = (categoria: CategoriaProducto) => {
  categoriaToDelete.value = categoria
  deleteModalOpen.value = true
}

const confirmDelete = async () => {
  if (!categoriaToDelete.value) return

  try {
    await deleteMutation.mutateAsync(categoriaToDelete.value.id)
    deleteModalOpen.value = false
    categoriaToDelete.value = null
  } catch {
    // toast en mutation
  }
}

const onCategoriaSaved = () => {
  selectedCategoria.value = null
}

const onSubcategoriasChanged = () => {
  // Las mutaciones ya invalidan categorías; el contador se actualiza solo.
}
</script>
