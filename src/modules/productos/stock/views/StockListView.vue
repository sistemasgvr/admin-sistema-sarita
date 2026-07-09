<template>
  <div>
    <PageBreadcrumb page-title="Stock" :items="breadcrumbItems" />

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
          search-placeholder="Almacén, código o producto..."
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

      <template #cell-almacen="{ row }">
        <div>
          <p class="font-medium text-gray-800 dark:text-white/90">
            {{ row.nombre_almacen }}
          </p>
          <p v-if="row.nombre_sucursal" class="text-theme-xs text-gray-500 dark:text-gray-400">
            {{ row.nombre_sucursal }}
          </p>
        </div>
      </template>

      <template #cell-producto="{ row }">
        <div>
          <p class="font-medium text-gray-800 dark:text-white/90">
            {{ row.nombre_producto }}
          </p>
          <p class="text-theme-xs text-gray-500 dark:text-gray-400">
            {{ row.codigo_producto }}
          </p>
        </div>
      </template>

      <template #cell-stock="{ value, row }">
        <span
          class="tabular-nums font-medium"
          :class="
            row.bajo_minimo
              ? 'text-error-600 dark:text-error-400'
              : 'text-gray-800 dark:text-white/90'
          "
        >
          {{ formatCantidad(value) }}
        </span>
      </template>

      <template #cell-stock_minimo="{ value }">
        <span class="tabular-nums text-gray-600 dark:text-gray-400">
          {{ formatCantidad(value) }}
        </span>
      </template>

      <template #cell-bajo_minimo="{ value }">
        <AppBadge
          v-if="value"
          variant="light"
          color="error"
        >
          Bajo mínimo
        </AppBadge>
        <AppBadge v-else variant="light" color="success">
          OK
        </AppBadge>
      </template>

      <template #actions="{ row }">
        <button
          v-if="canView"
          type="button"
          title="Ver"
          class="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm font-medium text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/5"
          @click="openDetailModal(row)"
        >
          <AppIcon :name="ICONS.eye" :size="16" />
        </button>

        <button
          v-if="canEdit"
          type="button"
          title="Ajustar"
          class="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm font-medium text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-500/10"
          @click="openEditModal(row)"
        >
          <AppIcon :name="ICONS.pencil" :size="16" />
          <!-- Ajustar -->
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
          :meta="stockQuery.data.value?.meta"
          :disabled="isLoading"
        />
      </template>
    </AppTable>

    <StockFormModal
      v-model="formModalOpen"
      :mode="formMode"
      :stock="selectedStock"
      :almacenes="almacenes"
      :productos="productos"
      @saved="onStockSaved"
    />

    <StockDetailModal v-model="detailModalOpen" :stock="stockToView" />

    <AppModal
      v-model="deleteModalOpen"
      title="Eliminar registro de stock"
      subtitle="Solo se puede eliminar si la cantidad es cero."
      size="sm"
    >
      <p class="text-sm text-gray-600 dark:text-gray-400">
        ¿Confirmas que deseas eliminar el stock de
        <span class="font-medium text-gray-800 dark:text-white/90">
          {{ stockToDelete?.nombre_producto }}
        </span>
        en
        <span class="font-medium text-gray-800 dark:text-white/90">
          {{ stockToDelete?.nombre_almacen }}
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
import { almacenesService } from '@/modules/configuracion/almacenes/services/almacenes.service'
import type { Almacen } from '@/modules/configuracion/almacenes/interfaces/almacen.interface'
import { productosService } from '@/modules/productos/articulos/services/productos.service'
import type { Producto } from '@/modules/productos/articulos/interfaces/producto.interface'
import StockFormModal from '@/modules/productos/stock/components/StockFormModal.vue'
import StockDetailModal from '@/modules/productos/stock/components/StockDetailModal.vue'
import { useDeleteStockMutation } from '@/modules/productos/stock/composables/useStockMutations'
import { useStockQuery } from '@/modules/productos/stock/composables/useStockQuery'
import { productosBreadcrumbItems } from '@/modules/productos/config/productos-breadcrumb'
import type {
  Stock,
  StockFormMode,
  StockListFilters,
} from '@/modules/productos/stock/interfaces/stock.interface'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import {
  AppBadge,
  AppListToolbar,
  AppModal,
  AppPagination,
  AppTable,
} from '@/shared/components'
import AppIcon from '@/shared/components/AppIcon.vue'
import { ICONS } from '@/shared/constants/icons'
import { PermisoBanderas } from '@/shared/constants/permissions'
import type { DynamicFilterFieldDef, DynamicFilterValues } from '@/shared/interfaces/dynamic-filter.interface'
import type { TableColumn } from '@/shared/interfaces/table.interface'

const authStore = useAuthStore()
const breadcrumbItems = productosBreadcrumbItems('Stock')

const almacenes = ref<Almacen[]>([])
const productos = ref<Producto[]>([])
const isLoadingAlmacenes = ref(false)

const dynamicFilters = ref<DynamicFilterValues>({})
const buscar = ref('')
const pagina = ref(1)
const limite = ref(10)

const filters = ref<StockListFilters>({
  buscar: '',
  pagina: 1,
  limite: 10,
})

const stockQuery = useStockQuery(filters)
const deleteMutation = useDeleteStockMutation()

const formModalOpen = ref(false)
const formMode = ref<StockFormMode>('create')
const selectedStock = ref<Stock | null>(null)

const deleteModalOpen = ref(false)
const stockToDelete = ref<Stock | null>(null)

const detailModalOpen = ref(false)
const stockToView = ref<Stock | null>(null)

const canCreate = computed(() => authStore.hasPermission(PermisoBanderas.STOCK_CREAR))
const canView = computed(() => authStore.hasPermission(PermisoBanderas.STOCK_VER))
const canEdit = computed(() => authStore.hasPermission(PermisoBanderas.STOCK_EDITAR))
const canDelete = computed(() => authStore.hasPermission(PermisoBanderas.STOCK_ELIMINAR))

const isLoading = computed(() => stockQuery.isFetching.value)
const rows = computed(() => stockQuery.data.value?.data ?? [])

const filterFields = computed<DynamicFilterFieldDef[]>(() => [
  {
    key: 'idAlmacen',
    label: 'Almacén',
    type: 'select',
    placeholder: 'Seleccionar almacén',
    disabled: isLoadingAlmacenes.value,
    options: almacenes.value.map((almacen) => ({
      value: almacen.id,
      label: almacen.nombre_sucursal
        ? `${almacen.nombre} (${almacen.nombre_sucursal})`
        : almacen.nombre,
    })),
  },
  {
    key: 'soloBajoMinimo',
    label: 'Bajo mínimo',
    type: 'checkbox',
    placeholder: 'Solo bajo mínimo',
  },
])

const columns = computed<TableColumn<Stock>[]>(() => [
  { key: 'almacen', label: 'Almacén' },
  { key: 'producto', label: 'Producto' },
  { key: 'nombre_unidad_medida', label: 'U.M.' },
  { key: 'stock', label: 'Stock' },
  { key: 'stock_minimo', label: 'Mínimo' },
  { key: 'bajo_minimo', label: 'Estado' },
])

let buscarTimeout: ReturnType<typeof setTimeout> | undefined

const formatCantidad = (value: unknown) => {
  const amount = Number(value ?? 0)
  return new Intl.NumberFormat('es-PE', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 4,
  }).format(amount)
}

const loadCatalogos = async () => {
  isLoadingAlmacenes.value = true
  try {
    const [almacenesResponse, productosResponse] = await Promise.all([
      almacenesService.listar({ pagina: 1, limite: 100 }),
      productosService.listar({ pagina: 1, limite: 500, afectaStock: true }),
    ])
    almacenes.value = almacenesResponse.data
    productos.value = productosResponse.data
  } catch {
    almacenes.value = []
    productos.value = []
  } finally {
    isLoadingAlmacenes.value = false
  }
}

onMounted(() => {
  loadCatalogos()
})

const syncFilters = () => {
  const active = dynamicFilters.value

  filters.value = {
    buscar: buscar.value.trim(),
    pagina: pagina.value,
    limite: limite.value,
    idAlmacen: active.idAlmacen != null ? Number(active.idAlmacen) : undefined,
    soloBajoMinimo: active.soloBajoMinimo === true ? true : undefined,
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
  selectedStock.value = null
  formModalOpen.value = true
}

const openEditModal = (stock: Stock) => {
  formMode.value = 'edit'
  selectedStock.value = stock
  formModalOpen.value = true
}

const openDetailModal = (stock: Stock) => {
  stockToView.value = stock
  detailModalOpen.value = true
}

const openDeleteModal = (stock: Stock) => {
  stockToDelete.value = stock
  deleteModalOpen.value = true
}

const confirmDelete = async () => {
  if (!stockToDelete.value) return

  try {
    await deleteMutation.mutateAsync(stockToDelete.value.id)
    deleteModalOpen.value = false
    stockToDelete.value = null
  } catch {
    // toast en mutation
  }
}

const onStockSaved = () => {
  selectedStock.value = null
}
</script>
