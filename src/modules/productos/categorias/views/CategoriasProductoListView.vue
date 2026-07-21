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
        <AppListToolbar
          v-model:search="buscar"
          search-placeholder="Nombre o descripción..."
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
        <div class="inline-flex items-center justify-end gap-1.5">
          <button
            v-if="canView"
            type="button"
            title="Ver detalle"
            class="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-300 text-gray-600 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
            @click="openDetailModal(row)"
          >
            <AppIcon :name="ICONS.eye" :size="15" />
          </button>

          <AppActionMenu
            :items="actionItemsForRow(row)"
            :execute="(key) => onActionSelect(key, row)"
          />
        </div>
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

    <CategoriaProductoDetailModal v-model="detailModalOpen" :categoria="categoriaToView" />

    <CategoriaSubcategoriasModal
      v-model="subcategoriasModalOpen"
      :categoria="categoriaForSubcategorias"
      @changed="onSubcategoriasChanged"
    />

    <AppModal
      v-model="deleteModalOpen"
      title="Eliminar categoría"
      :subtitle="
        deleteBlockedBySubcategorias
          ? 'Esta categoría tiene subcategorías activas.'
          : 'No se puede eliminar si tiene subcategorías activas.'
      "
      size="sm"
    >
      <div
        v-if="deleteBlockedBySubcategorias"
        class="rounded-lg border border-error-200 bg-error-50 px-3 py-2.5 text-sm text-error-700 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-300"
      >
        No puedes eliminar
        <span class="font-medium">{{ categoriaToDelete?.nombre }}</span>
        porque tiene subcategorías activas. Elimina o reasigna las subcategorías e
        inténtalo de nuevo.
      </div>

      <p v-else class="text-sm text-gray-600 dark:text-gray-400">
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
          {{ deleteBlockedBySubcategorias ? 'Cerrar' : 'Cancelar' }}
        </button>
        <button
          v-if="!deleteBlockedBySubcategorias"
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
import CategoriaProductoDetailModal from '@/modules/productos/categorias/components/CategoriaProductoDetailModal.vue'
import { useDeleteCategoriaProductoMutation } from '@/modules/productos/categorias/composables/useCategoriaProductoMutations'
import { useCategoriasProductoQuery } from '@/modules/productos/categorias/composables/useCategoriasProductoQuery'
import { productosBreadcrumbItems } from '@/modules/productos/config/productos-breadcrumb'
import type {
  CategoriaProducto,
  CategoriaProductoFormMode,
  CategoriaProductoListFilters,
} from '@/modules/productos/categorias/interfaces/categoria-producto.interface'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import {
  AppActionMenu,
  AppBadge,
  AppListToolbar,
  AppModal,
  AppPagination,
  AppTable,
} from '@/shared/components'
import AppIcon from '@/shared/components/AppIcon.vue'
import { ICONS } from '@/shared/constants/icons'
import { PermisoBanderas } from '@/shared/constants/permissions'
import type { ActionMenuItem } from '@/shared/interfaces/action-menu.interface'
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
const deleteBlockedBySubcategorias = computed(
  () => Number(categoriaToDelete.value?.total_sub_categorias ?? 0) > 0,
)

const detailModalOpen = ref(false)
const categoriaToView = ref<CategoriaProducto | null>(null)

const canCreate = computed(() => authStore.hasPermission(PermisoBanderas.CATEGORIAS_CREAR))
const canView = computed(() => authStore.hasPermission(PermisoBanderas.CATEGORIAS_VER))
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

const syncFilters = () => {
  filters.value = {
    buscar: buscar.value.trim(),
    pagina: pagina.value,
    limite: limite.value,
  }
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
  selectedCategoria.value = null
  formModalOpen.value = true
}

const openEditModal = (categoria: CategoriaProducto) => {
  formMode.value = 'edit'
  selectedCategoria.value = categoria
  formModalOpen.value = true
}

const openDetailModal = (categoria: CategoriaProducto) => {
  categoriaToView.value = categoria
  detailModalOpen.value = true
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

function actionItemsForRow(row: CategoriaProducto): ActionMenuItem[] {
  const busy = deleteMutation.isPending.value
  const blockedBySubcategorias = Number(row.total_sub_categorias ?? 0) > 0

  return [
    {
      key: 'subcategorias',
      label: 'Subcategorías',
      icon: ICONS.listTree,
      disabled: busy,
      hidden: !canManageSubCategorias.value,
    },
    {
      key: 'edit',
      label: 'Editar',
      icon: ICONS.pencil,
      disabled: busy,
      hidden: !canEdit.value,
    },
    {
      key: 'delete',
      label: blockedBySubcategorias ? 'Eliminar (tiene subcategorías)' : 'Eliminar',
      icon: ICONS.trash,
      danger: !blockedBySubcategorias,
      disabled: busy || blockedBySubcategorias,
      hidden: !canDelete.value,
    },
  ]
}

function onActionSelect(key: string, row: CategoriaProducto) {
  switch (key) {
    case 'subcategorias':
      openSubcategoriasModal(row)
      return
    case 'edit':
      openEditModal(row)
      return
    case 'delete':
      openDeleteModal(row)
      return
  }
}

const onCategoriaSaved = () => {
  selectedCategoria.value = null
}

const onSubcategoriasChanged = () => {
  // Las mutaciones ya invalidan categorías; el contador se actualiza solo.
}
</script>
