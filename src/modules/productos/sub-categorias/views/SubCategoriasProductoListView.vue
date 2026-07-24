<template>
  <div>
    <PageBreadcrumb page-title="Subcategorías" :items="breadcrumbItems" />

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
          search-placeholder="Nombre..."
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

      <template #cell-total_productos="{ value }">
        <AppBadge variant="light">{{ value ?? 0 }}</AppBadge>
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
          :meta="subCategoriasQuery.data.value?.meta"
          :disabled="isLoading"
        />
      </template>
    </AppTable>

    <SubCategoriaProductoFormModal
      v-model="formModalOpen"
      :mode="formMode"
      :sub-categoria="selectedSubCategoria"
      :categorias="categorias"
      @saved="onSubCategoriaSaved"
    />

    <SubCategoriaProductoDetailModal
      v-model="detailModalOpen"
      :sub-categoria="subCategoriaToView"
    />

    <AppModal
      v-model="deleteModalOpen"
      title="Eliminar subcategoría"
      :subtitle="
        deleteBlockedByProductos
          ? 'Esta subcategoría tiene productos activos.'
          : 'No se puede eliminar si tiene productos activos.'
      "
      size="sm"
    >
      <div
        v-if="deleteBlockedByProductos"
        class="rounded-lg border border-error-200 bg-error-50 px-3 py-2.5 text-sm text-error-700 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-300"
      >
        No puedes eliminar
        <span class="font-medium">{{ subCategoriaToDelete?.nombre }}</span>
        porque tiene productos asociados. Reasigna o elimina esos productos e
        inténtalo de nuevo.
      </div>

      <p v-else class="text-sm text-gray-600 dark:text-gray-400">
        ¿Confirmas que deseas eliminar
        <span class="font-medium text-gray-800 dark:text-white/90">
          {{ subCategoriaToDelete?.nombre }}
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
          {{ deleteBlockedByProductos ? 'Cerrar' : 'Cancelar' }}
        </button>
        <button
          v-if="!deleteBlockedByProductos"
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
import { categoriasProductoService } from '@/modules/productos/categorias/services/categorias-producto.service'
import type { CategoriaProducto } from '@/modules/productos/categorias/interfaces/categoria-producto.interface'
import SubCategoriaProductoFormModal from '@/modules/productos/sub-categorias/components/SubCategoriaProductoFormModal.vue'
import SubCategoriaProductoDetailModal from '@/modules/productos/sub-categorias/components/SubCategoriaProductoDetailModal.vue'
import { useDeleteSubCategoriaProductoMutation } from '@/modules/productos/sub-categorias/composables/useSubCategoriaProductoMutations'
import { useSubCategoriasProductoQuery } from '@/modules/productos/sub-categorias/composables/useSubCategoriasProductoQuery'
import { productosBreadcrumbItems } from '@/modules/productos/config/productos-breadcrumb'
import type {
  SubCategoriaProducto,
  SubCategoriaProductoFormMode,
  SubCategoriaProductoListFilters,
} from '@/modules/productos/sub-categorias/interfaces/sub-categoria-producto.interface'
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
import type { DynamicFilterFieldDef, DynamicFilterValues } from '@/shared/interfaces/dynamic-filter.interface'
import type { TableColumn } from '@/shared/interfaces/table.interface'

const authStore = useAuthStore()
const route = useRoute()
const breadcrumbItems = productosBreadcrumbItems('Subcategorías')

const categorias = ref<CategoriaProducto[]>([])
const dynamicFilters = ref<DynamicFilterValues>({})
const buscar = ref('')
const pagina = ref(1)
const limite = ref(10)

const filters = ref<SubCategoriaProductoListFilters>({
  buscar: '',
  pagina: 1,
  limite: 10,
})

const subCategoriasQuery = useSubCategoriasProductoQuery(filters)
const deleteMutation = useDeleteSubCategoriaProductoMutation()

const formModalOpen = ref(false)
const formMode = ref<SubCategoriaProductoFormMode>('create')
const selectedSubCategoria = ref<SubCategoriaProducto | null>(null)

const deleteModalOpen = ref(false)
const subCategoriaToDelete = ref<SubCategoriaProducto | null>(null)
const deleteBlockedByProductos = computed(
  () => Number(subCategoriaToDelete.value?.total_productos ?? 0) > 0,
)

const detailModalOpen = ref(false)
const subCategoriaToView = ref<SubCategoriaProducto | null>(null)

const canCreate = computed(() => authStore.hasPermission(PermisoBanderas.SUB_CATEGORIAS_CREAR))
const canView = computed(() => authStore.hasPermission(PermisoBanderas.SUB_CATEGORIAS_VER))
const canEdit = computed(() => authStore.hasPermission(PermisoBanderas.SUB_CATEGORIAS_EDITAR))
const canDelete = computed(() => authStore.hasPermission(PermisoBanderas.SUB_CATEGORIAS_ELIMINAR))

const isLoading = computed(() => subCategoriasQuery.isFetching.value)
const rows = computed(() => subCategoriasQuery.data.value?.data ?? [])

const filterFields = computed<DynamicFilterFieldDef[]>(() => [
  {
    key: 'idCategoria',
    label: 'Categoría',
    type: 'select',
    placeholder: 'Seleccionar categoría',
    options: categorias.value.map((categoria) => ({
      value: categoria.id,
      label: categoria.nombre,
    })),
  },
])

const columns = computed<TableColumn<SubCategoriaProducto>[]>(() => [
  { key: 'nombre_categoria', label: 'Categoría' },
  { key: 'nombre', label: 'Subcategoría' },
  { key: 'descripcion', label: 'Descripción' },
  { key: 'total_productos', label: 'Productos' },
])

let buscarTimeout: ReturnType<typeof setTimeout> | undefined

onMounted(async () => {
  try {
    const response = await categoriasProductoService.listar({ pagina: 1, limite: 100 })
    categorias.value = response.data
  } catch {
    categorias.value = []
  }

  const idCategoriaQuery = route.query.idCategoria
  if (idCategoriaQuery) {
    dynamicFilters.value = { idCategoria: Number(idCategoriaQuery) }
    syncFilters()
  }
})

const syncFilters = () => {
  const active = dynamicFilters.value

  filters.value = {
    buscar: buscar.value.trim(),
    pagina: pagina.value,
    limite: limite.value,
    idCategoria: active.idCategoria != null ? Number(active.idCategoria) : undefined,
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
  selectedSubCategoria.value = null
  formModalOpen.value = true
}

const openEditModal = (subCategoria: SubCategoriaProducto) => {
  formMode.value = 'edit'
  selectedSubCategoria.value = subCategoria
  formModalOpen.value = true
}

const openDetailModal = (subCategoria: SubCategoriaProducto) => {
  subCategoriaToView.value = subCategoria
  detailModalOpen.value = true
}

const openDeleteModal = (subCategoria: SubCategoriaProducto) => {
  subCategoriaToDelete.value = subCategoria
  deleteModalOpen.value = true
}

const confirmDelete = async () => {
  if (!subCategoriaToDelete.value) return

  try {
    await deleteMutation.mutateAsync(subCategoriaToDelete.value.id)
    deleteModalOpen.value = false
    subCategoriaToDelete.value = null
  } catch {
    // toast en mutation
  }
}

function actionItemsForRow(row: SubCategoriaProducto): ActionMenuItem[] {
  const busy = deleteMutation.isPending.value
  const blockedByProductos = Number(row.total_productos ?? 0) > 0

  return [
    {
      key: 'edit',
      label: 'Editar',
      icon: ICONS.pencil,
      disabled: busy,
      hidden: !canEdit.value,
    },
    {
      key: 'delete',
      label: blockedByProductos ? 'Eliminar (tiene productos)' : 'Eliminar',
      icon: ICONS.trash,
      danger: !blockedByProductos,
      disabled: busy || blockedByProductos,
      hidden: !canDelete.value,
    },
  ]
}

function onActionSelect(key: string, row: SubCategoriaProducto) {
  switch (key) {
    case 'edit':
      openEditModal(row)
      return
    case 'delete':
      openDeleteModal(row)
      return
  }
}

const onSubCategoriaSaved = () => {
  selectedSubCategoria.value = null
}
</script>
