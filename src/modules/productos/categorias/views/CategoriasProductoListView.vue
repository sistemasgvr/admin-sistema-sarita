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
            <div class="w-full sm:w-40">
              <AppSelect v-model="mostrarEstado" :options="estadoFiltroOptions" />
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
          </template>
        </AppListToolbar>
      </template>

      <template #cell-total_sub_categorias="{ row }">
        <button
          v-if="canManageSubCategorias"
          type="button"
          class="inline-flex max-w-full flex-wrap items-center gap-1 text-left"
          :title="subcategoriasTitle(row)"
          @click="openSubcategoriasModal(row)"
        >
          <AppBadge
            v-for="nombre in nombresSubcategoriasVisibles(row)"
            :key="`${row.id}-${nombre}`"
            size="sm"
            variant="light"
            color="primary"
          >
            {{ nombre }}
          </AppBadge>
          <AppBadge
            v-if="nombresSubcategoriasExtra(row) > 0"
            size="sm"
            variant="light"
            color="neutral"
          >
            +{{ nombresSubcategoriasExtra(row) }}
          </AppBadge>
          <AppBadge
            v-if="!nombresSubcategorias(row).length"
            size="sm"
            variant="light"
            color="neutral"
          >
            Sin subcategorías
          </AppBadge>
        </button>
        <div
          v-else
          class="inline-flex max-w-full flex-wrap items-center gap-1"
          :title="subcategoriasTitle(row)"
        >
          <AppBadge
            v-for="nombre in nombresSubcategoriasVisibles(row)"
            :key="`${row.id}-${nombre}`"
            size="sm"
            variant="light"
            color="primary"
          >
            {{ nombre }}
          </AppBadge>
          <AppBadge
            v-if="nombresSubcategoriasExtra(row) > 0"
            size="sm"
            variant="light"
            color="neutral"
          >
            +{{ nombresSubcategoriasExtra(row) }}
          </AppBadge>
          <AppBadge
            v-if="!nombresSubcategorias(row).length"
            size="sm"
            variant="light"
            color="neutral"
          >
            Sin subcategorías
          </AppBadge>
        </div>
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
import {
  useDeleteCategoriaProductoMutation,
  useRestaurarCategoriaProductoMutation,
} from '@/modules/productos/categorias/composables/useCategoriaProductoMutations'
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
  AppSelect,
  AppTable,
} from '@/shared/components'
import AppIcon from '@/shared/components/AppIcon.vue'
import { ICONS } from '@/shared/constants/icons'
import { PermisoBanderas } from '@/shared/constants/permissions'
import type { ActionMenuItem } from '@/shared/interfaces/action-menu.interface'
import type { SelectOption } from '@/shared/interfaces/form.interface'
import type { TableColumn } from '@/shared/interfaces/table.interface'

type EstadoFiltro = 'activos' | 'inactivos' | 'todos'

const authStore = useAuthStore()
const breadcrumbItems = productosBreadcrumbItems('Categorías')

const buscar = ref('')
const pagina = ref(1)
const limite = ref(10)
const mostrarEstado = ref<EstadoFiltro>('activos')

const estadoFiltroOptions: SelectOption[] = [
  { label: 'Activos', value: 'activos' },
  { label: 'Inactivos', value: 'inactivos' },
  { label: 'Todos', value: 'todos' },
]

const buildSoloActivos = (value: EstadoFiltro): number | null => {
  switch (value) {
    case 'activos':
      return 1
    case 'inactivos':
      return 0
    case 'todos':
    default:
      return null
  }
}

const filters = ref<CategoriaProductoListFilters>({
  buscar: '',
  pagina: 1,
  limite: 10,
  soloActivos: 1,
})

const categoriasQuery = useCategoriasProductoQuery(filters)
const deleteMutation = useDeleteCategoriaProductoMutation()
const restaurarMutation = useRestaurarCategoriaProductoMutation()

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
const canRestore = computed(() => authStore.hasPermission(PermisoBanderas.CATEGORIAS_RESTAURAR))
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

const SUBCATEGORIAS_VISIBLE_MAX = 3

const nombresSubcategorias = (row: CategoriaProducto): string[] => {
  const names = row.nombres_sub_categorias
  if (Array.isArray(names) && names.length) {
    return names.map((n) => String(n)).filter(Boolean)
  }
  return []
}

const nombresSubcategoriasVisibles = (row: CategoriaProducto) =>
  nombresSubcategorias(row).slice(0, SUBCATEGORIAS_VISIBLE_MAX)

const nombresSubcategoriasExtra = (row: CategoriaProducto) =>
  Math.max(0, nombresSubcategorias(row).length - SUBCATEGORIAS_VISIBLE_MAX)

const subcategoriasTitle = (row: CategoriaProducto) => {
  const names = nombresSubcategorias(row)
  if (!names.length) return 'Sin subcategorías'
  return names.join(', ')
}

let buscarTimeout: ReturnType<typeof setTimeout> | undefined

const syncFilters = () => {
  filters.value = {
    buscar: buscar.value.trim(),
    pagina: pagina.value,
    limite: limite.value,
    soloActivos: buildSoloActivos(mostrarEstado.value),
  }
}

watch(buscar, () => {
  clearTimeout(buscarTimeout)
  buscarTimeout = setTimeout(() => {
    pagina.value = 1
    syncFilters()
  }, 350)
})

watch(mostrarEstado, () => {
  pagina.value = 1
  syncFilters()
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

const restaurarCategoria = async (categoria: CategoriaProducto) => {
  try {
    await restaurarMutation.mutateAsync(categoria.id)
  } catch {
    // toast en mutation
  }
}

function actionItemsForRow(row: CategoriaProducto): ActionMenuItem[] {
  const busy = deleteMutation.isPending.value || restaurarMutation.isPending.value
  const blockedBySubcategorias = Number(row.total_sub_categorias ?? 0) > 0
  const activo = row.estado === 1

  return [
    {
      key: 'subcategorias',
      label: 'Subcategorías',
      icon: ICONS.listTree,
      disabled: busy,
      hidden: !(canManageSubCategorias.value && activo),
    },
    {
      key: 'edit',
      label: 'Editar',
      icon: ICONS.pencil,
      disabled: busy,
      hidden: !(canEdit.value && activo),
    },
    {
      key: 'restore',
      label: 'Restaurar',
      icon: ICONS.check,
      disabled: busy,
      loading: restaurarMutation.isPending.value,
      hidden: !(canRestore.value && !activo),
    },
    {
      key: 'delete',
      label: blockedBySubcategorias ? 'Eliminar (tiene subcategorías)' : 'Eliminar',
      icon: ICONS.trash,
      danger: !blockedBySubcategorias,
      disabled: busy || blockedBySubcategorias,
      hidden: !(canDelete.value && activo),
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
    case 'restore':
      return restaurarCategoria(row)
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
