<template>
  <div>
    <PageBreadcrumb page-title="Catálogo de precios" :items="breadcrumbItems" />

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
          search-placeholder="Nombre, producto o periodo..."
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

      <template #cell-nombre_tipo_catalogo="{ value }">
        <ListaOpcionBadge :value="value as string" raw />
      </template>

      <template #cell-producto="{ row }">
        <div v-if="row.nombre_producto">
          <p class="font-medium text-gray-800 dark:text-white/90">
            {{ row.nombre_producto }}
          </p>
          <p class="text-theme-xs text-gray-500 dark:text-gray-400">
            {{ row.codigo_producto }}
          </p>
        </div>
        <span v-else class="text-gray-400">—</span>
      </template>

      <template #cell-precio_final="{ value }">
        <span class="tabular-nums">{{ formatPrecio(value) }}</span>
      </template>

      <template #cell-precio_garantia="{ value }">
        <span class="tabular-nums">{{ value != null ? formatPrecio(value) : '—' }}</span>
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
          :meta="catalogoPreciosQuery.data.value?.meta"
          :disabled="isLoading"
        />
      </template>
    </AppTable>

    <CatalogoPrecioFormModal
      v-model="formModalOpen"
      :mode="formMode"
      :catalogo-precio="selectedCatalogoPrecio"
      :productos="productos"
      @saved="onCatalogoPrecioSaved"
    />

    <CatalogoPrecioDetailModal
      v-model="detailModalOpen"
      :catalogo-precio="catalogoPrecioToView"
    />

    <AppModal
      v-model="deleteModalOpen"
      title="Eliminar ítem de catálogo"
      subtitle="Esta acción desactivará el ítem en el catálogo de precios."
      size="sm"
    >
      <p class="text-sm text-gray-600 dark:text-gray-400">
        ¿Confirmas que deseas eliminar
        <span class="font-medium text-gray-800 dark:text-white/90">
          {{ catalogoPrecioToDelete?.nombre_item }}
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
import { useListaOpcionesQuery } from '@/modules/catalogos/composables/useListaOpcionesQuery'
import { productosService } from '@/modules/productos/articulos/services/productos.service'
import type { Producto } from '@/modules/productos/articulos/interfaces/producto.interface'
import CatalogoPrecioFormModal from '@/modules/productos/catalogo-precios/components/CatalogoPrecioFormModal.vue'
import CatalogoPrecioDetailModal from '@/modules/productos/catalogo-precios/components/CatalogoPrecioDetailModal.vue'
import { useDeleteCatalogoPrecioMutation } from '@/modules/productos/catalogo-precios/composables/useCatalogoPrecioMutations'
import { useCatalogoPreciosQuery } from '@/modules/productos/catalogo-precios/composables/useCatalogoPreciosQuery'
import { productosBreadcrumbItems } from '@/modules/productos/config/productos-breadcrumb'
import type {
  CatalogoPrecio,
  CatalogoPrecioFormMode,
  CatalogoPrecioListFilters,
} from '@/modules/productos/catalogo-precios/interfaces/catalogo-precio.interface'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import {
  AppActionMenu,
  AppListToolbar,
  AppModal,
  AppPagination,
  AppTable,
  ListaOpcionBadge,
} from '@/shared/components'
import AppIcon from '@/shared/components/AppIcon.vue'
import { ICONS } from '@/shared/constants/icons'
import { ListaIds } from '@/shared/constants/lista-ids'
import { PermisoBanderas } from '@/shared/constants/permissions'
import type { ActionMenuItem } from '@/shared/interfaces/action-menu.interface'
import type { DynamicFilterFieldDef, DynamicFilterValues } from '@/shared/interfaces/dynamic-filter.interface'
import type { TableColumn } from '@/shared/interfaces/table.interface'

const authStore = useAuthStore()
const breadcrumbItems = productosBreadcrumbItems('Catálogo de precios')

const listaTipoCatalogoId = ref(ListaIds.TIPO_CATALOGO_PRECIO)
const tiposCatalogoQuery = useListaOpcionesQuery(listaTipoCatalogoId)

const productos = ref<Producto[]>([])

const dynamicFilters = ref<DynamicFilterValues>({})
const buscar = ref('')
const pagina = ref(1)
const limite = ref(10)

const filters = ref<CatalogoPrecioListFilters>({
  buscar: '',
  pagina: 1,
  limite: 10,
})

const catalogoPreciosQuery = useCatalogoPreciosQuery(filters)
const deleteMutation = useDeleteCatalogoPrecioMutation()

const formModalOpen = ref(false)
const formMode = ref<CatalogoPrecioFormMode>('create')
const selectedCatalogoPrecio = ref<CatalogoPrecio | null>(null)

const deleteModalOpen = ref(false)
const catalogoPrecioToDelete = ref<CatalogoPrecio | null>(null)

const detailModalOpen = ref(false)
const catalogoPrecioToView = ref<CatalogoPrecio | null>(null)

const canCreate = computed(() => authStore.hasPermission(PermisoBanderas.CATALOGO_PRECIOS_CREAR))
const canView = computed(() => authStore.hasPermission(PermisoBanderas.CATALOGO_PRECIOS_VER))
const canEdit = computed(() => authStore.hasPermission(PermisoBanderas.CATALOGO_PRECIOS_EDITAR))
const canDelete = computed(() => authStore.hasPermission(PermisoBanderas.CATALOGO_PRECIOS_ELIMINAR))

const isLoading = computed(() => catalogoPreciosQuery.isFetching.value)
const rows = computed(() => catalogoPreciosQuery.data.value?.data ?? [])

const filterFields = computed<DynamicFilterFieldDef[]>(() => [
  {
    key: 'idTipoCatalogo',
    label: 'Tipo',
    type: 'select',
    placeholder: 'Seleccionar tipo',
    disabled: tiposCatalogoQuery.isFetching.value,
    options: (tiposCatalogoQuery.data.value ?? []).map((opcion) => ({
      value: opcion.id,
      label: opcion.nombre,
    })),
  },
  {
    key: 'periodo',
    label: 'Periodo',
    type: 'text',
    placeholder: '2026-Q2',
  },
])

const columns = computed<TableColumn<CatalogoPrecio>[]>(() => [
  { key: 'nombre_tipo_catalogo', label: 'Tipo' },
  { key: 'periodo', label: 'Periodo' },
  { key: 'nombre_item', label: 'Ítem' },
  { key: 'producto', label: 'Producto' },
  { key: 'precio_final', label: 'Precio final' },
  { key: 'precio_garantia', label: 'Garantía' },
])

let buscarTimeout: ReturnType<typeof setTimeout> | undefined

const syncFilters = () => {
  const active = dynamicFilters.value

  filters.value = {
    buscar: buscar.value.trim(),
    pagina: pagina.value,
    limite: limite.value,
    idTipoCatalogo:
      active.idTipoCatalogo != null ? Number(active.idTipoCatalogo) : undefined,
    periodo: active.periodo ? String(active.periodo).trim() || undefined : undefined,
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

const formatPrecio = (value: unknown) => {
  const amount = Number(value ?? 0)
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
    minimumFractionDigits: 2,
  }).format(amount)
}

onMounted(async () => {
  try {
    const response = await productosService.listar({ pagina: 1, limite: 500 })
    productos.value = response.data
  } catch {
    productos.value = []
  }
})

const openCreateModal = () => {
  formMode.value = 'create'
  selectedCatalogoPrecio.value = null
  formModalOpen.value = true
}

const openEditModal = (catalogoPrecio: CatalogoPrecio) => {
  formMode.value = 'edit'
  selectedCatalogoPrecio.value = catalogoPrecio
  formModalOpen.value = true
}

const openDetailModal = (catalogoPrecio: CatalogoPrecio) => {
  catalogoPrecioToView.value = catalogoPrecio
  detailModalOpen.value = true
}

const openDeleteModal = (catalogoPrecio: CatalogoPrecio) => {
  catalogoPrecioToDelete.value = catalogoPrecio
  deleteModalOpen.value = true
}

const confirmDelete = async () => {
  if (!catalogoPrecioToDelete.value) return

  try {
    await deleteMutation.mutateAsync(catalogoPrecioToDelete.value.id)
    deleteModalOpen.value = false
    catalogoPrecioToDelete.value = null
  } catch {
    // toast en mutation
  }
}

function actionItemsForRow(_row: CatalogoPrecio): ActionMenuItem[] {
  const busy = deleteMutation.isPending.value

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
      label: 'Eliminar',
      icon: ICONS.trash,
      danger: true,
      disabled: busy,
      hidden: !canDelete.value,
    },
  ]
}

function onActionSelect(key: string, row: CatalogoPrecio) {
  switch (key) {
    case 'edit':
      openEditModal(row)
      return
    case 'delete':
      openDeleteModal(row)
      return
  }
}

const onCatalogoPrecioSaved = () => {
  selectedCatalogoPrecio.value = null
}
</script>
