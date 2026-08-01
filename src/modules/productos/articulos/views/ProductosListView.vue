<template>
  <div>
    <PageBreadcrumb page-title="Productos" :items="breadcrumbItems" />

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
          search-placeholder="Código, ubicación, nombre o marca..."
          @filter-change="onFiltersChange"
        >
          <template #actions>
            <div class="w-full sm:w-44">
              <AppSelect v-model="tipoFiltro" :options="tipoFiltroOptions" />
            </div>
            <div class="w-full sm:w-40">
              <AppSelect v-model="mostrarProductos" :options="estadoFiltroOptions" />
            </div>
            <button
              v-if="canView"
              type="button"
              class="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-theme-xs transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-white/[0.03]"
              @click="printModalOpen = true"
            >
              <AppIcon :name="ICONS.printer" :size="18" />
              Imprimir ubicación
            </button>
            <RouterLink
              v-if="canCreate"
              :to="{ name: 'admin-productos-articulos-nuevo' }"
              class="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white shadow-theme-xs transition hover:bg-brand-600"
            >
              <AppIcon :name="ICONS.plus" :size="18" />
              Nuevo
            </RouterLink>
          </template>
        </AppListToolbar>
      </template>

      <template #cell-nombre="{ row }">
        <div class="flex min-w-0 flex-wrap items-center gap-1.5">
          <span class="font-medium text-gray-800 dark:text-white/90">{{ row.nombre }}</span>
          <AppBadge
            v-if="esProductoSistema(row)"
            size="sm"
            color="primary"
            title="Producto de sistema para facturación del POS"
          >
            Sistema
          </AppBadge>
        </div>
      </template>

      <template #cell-categoria="{ row }">
        <span class="text-sm text-gray-700 dark:text-gray-300">
          {{ row.nombre_categoria ?? '—' }}
          <template v-if="row.nombre_sub_categoria">
            <span class="text-gray-400 dark:text-gray-500"> / </span>
            {{ row.nombre_sub_categoria }}
          </template>
        </span>
      </template>

      <template #cell-codigo_ubicacion="{ value }">
        <span class="tabular-nums text-sm text-gray-700 dark:text-gray-300">
          {{ value || '—' }}
        </span>
      </template>

      <template #cell-precio="{ value }">
        <span class="tabular-nums">
          {{ formatPrecio(value) }}
        </span>
      </template>

      <template #cell-tipo="{ row }">
        <div class="flex flex-wrap items-center gap-1.5">
          <AppBadge :color="row.es_servicio ? 'warning' : 'primary'" variant="light">
            {{ row.es_servicio ? 'Servicio' : 'Producto' }}
          </AppBadge>
          <AppBadge v-if="row.es_gas" variant="light" color="success">Gas</AppBadge>
          <AppBadge v-if="row.es_alquilable" variant="light" color="neutral">Alquilable</AppBadge>
        </div>
      </template>

      <template #cell-estado="{ row }">
        <AppBadge :color="row.estado === 1 ? 'success' : 'error'">
          {{ row.estado === 1 ? 'Activo' : 'Inactivo' }}
        </AppBadge>
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
          :meta="productosQuery.data.value?.meta"
          :disabled="isLoading"
        />
      </template>
    </AppTable>

    <ProductoDetailModal v-model="detailModalOpen" :producto="productoToView" />

    <ProductoUbicacionesPrintModal v-model="printModalOpen" />

    <AppModal
      v-model="deleteModalOpen"
      title="Eliminar producto"
      :subtitle="
        deleteBlockedByStock
          ? 'Este producto tiene stock distinto de cero.'
          : 'No se puede eliminar si tiene stock distinto de cero.'
      "
      size="sm"
    >
      <div
        v-if="deleteBlockedByStock"
        class="rounded-lg border border-error-200 bg-error-50 px-3 py-2.5 text-sm text-error-700 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-300"
      >
        No puedes eliminar
        <span class="font-medium">{{ productoToDelete?.nombre }}</span>
        porque tiene stock en almacén. Ajusta o traslada el stock a cero e inténtalo de nuevo.
      </div>

      <p v-else class="text-sm text-gray-600 dark:text-gray-400">
        ¿Confirmas que deseas eliminar
        <span class="font-medium text-gray-800 dark:text-white/90">
          {{ productoToDelete?.nombre }}
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
          {{ deleteBlockedByStock ? 'Cerrar' : 'Cancelar' }}
        </button>
        <button
          v-if="!deleteBlockedByStock"
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
import { useRoute, useRouter } from 'vue-router'
import PageBreadcrumb from '@/modules/admin/components/PageBreadcrumb.vue'
import ProductoDetailModal from '@/modules/productos/articulos/components/ProductoDetailModal.vue'
import ProductoUbicacionesPrintModal from '@/modules/productos/articulos/components/ProductoUbicacionesPrintModal.vue'
import {
  useDeleteProductoMutation,
  useRestaurarProductoMutation,
} from '@/modules/productos/articulos/composables/useProductoMutations'
import { useProductosQuery } from '@/modules/productos/articulos/composables/useProductosQuery'
import type {
  Producto,
  ProductoEstadoFiltro,
  ProductoListFilters,
} from '@/modules/productos/articulos/interfaces/producto.interface'
import { esProductoSistema } from '@/modules/productos/articulos/utils/productosSistema'
import { categoriasProductoService } from '@/modules/productos/categorias/services/categorias-producto.service'
import type { CategoriaProducto } from '@/modules/productos/categorias/interfaces/categoria-producto.interface'
import { productosBreadcrumbItems } from '@/modules/productos/config/productos-breadcrumb'
import { subCategoriasProductoService } from '@/modules/productos/sub-categorias/services/sub-categorias-producto.service'
import type { SubCategoriaProducto } from '@/modules/productos/sub-categorias/interfaces/sub-categoria-producto.interface'
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
import type { DynamicFilterFieldDef, DynamicFilterValues } from '@/shared/interfaces/dynamic-filter.interface'
import type { SelectOption } from '@/shared/interfaces/form.interface'
import type { TableColumn } from '@/shared/interfaces/table.interface'

const authStore = useAuthStore()
const route = useRoute()
const router = useRouter()
const breadcrumbItems = productosBreadcrumbItems('Productos')

const categorias = ref<CategoriaProducto[]>([])
const subCategorias = ref<SubCategoriaProducto[]>([])

const dynamicFilters = ref<DynamicFilterValues>({})
const buscar = ref('')
const pagina = ref(1)
const limite = ref(10)
const mostrarProductos = ref<ProductoEstadoFiltro>('activos')
const tipoFiltro = ref<'todos' | 'producto' | 'servicio'>('todos')

const estadoFiltroOptions: SelectOption[] = [
  { label: 'Activos', value: 'activos' },
  { label: 'Inactivos', value: 'inactivos' },
  { label: 'Todos', value: 'todos' },
]

const tipoFiltroOptions: SelectOption[] = [
  { label: 'Tipo: todos', value: 'todos' },
  { label: 'Solo productos', value: 'producto' },
  { label: 'Solo servicios', value: 'servicio' },
]

const buildSoloActivos = (value: ProductoEstadoFiltro): number | null | undefined => {
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

const filters = ref<ProductoListFilters>({
  buscar: '',
  pagina: 1,
  limite: 10,
  soloActivos: 1,
  incluirImagenes: true,
})

const productosQuery = useProductosQuery(filters)
const deleteMutation = useDeleteProductoMutation()
const restaurarMutation = useRestaurarProductoMutation()

const deleteModalOpen = ref(false)
const productoToDelete = ref<Producto | null>(null)
const deleteBlockedByStock = computed(() => Boolean(productoToDelete.value?.tiene_stock))

const detailModalOpen = ref(false)
const productoToView = ref<Producto | null>(null)
const printModalOpen = ref(false)

const canCreate = computed(() => authStore.hasPermission(PermisoBanderas.PRODUCTOS_CREAR))
const canView = computed(() => authStore.hasPermission(PermisoBanderas.PRODUCTOS_VER))
const canEdit = computed(() => authStore.hasPermission(PermisoBanderas.PRODUCTOS_EDITAR))
const canDelete = computed(() => authStore.hasPermission(PermisoBanderas.PRODUCTOS_ELIMINAR))
const canRestore = computed(() =>
  authStore.hasPermission(PermisoBanderas.PRODUCTOS_RESTAURAR),
)

const isLoading = computed(() => productosQuery.isFetching.value)
const rows = computed(() => productosQuery.data.value?.data ?? [])

const filterFields = computed<DynamicFilterFieldDef[]>(() => {
  const categoriaId =
    dynamicFilters.value.idCategoria != null
      ? Number(dynamicFilters.value.idCategoria)
      : null

  return [
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
    {
      key: 'idSubCategoria',
      label: 'Subcategoría',
      type: 'select',
      placeholder: 'Seleccionar subcategoría',
      disabled: !categoriaId,
      options: subCategorias.value
        .filter((subCategoria) =>
          categoriaId ? subCategoria.id_categoria === categoriaId : true,
        )
        .map((subCategoria) => ({
          value: subCategoria.id,
          label: subCategoria.nombre,
        })),
    },
  ]
})

const columns = computed<TableColumn<Producto>[]>(() => [
  { key: 'codigo', label: 'Código' },
  { key: 'codigo_ubicacion', label: 'Ubicación' },
  { key: 'nombre', label: 'Nombre' },
  { key: 'categoria', label: 'Categoría' },
  { key: 'tipo', label: 'Tipo' },
  { key: 'nombre_unidad_medida', label: 'U.M.' },
  { key: 'precio', label: 'Precio' },
  { key: 'estado', label: 'Estado' },
])

let buscarTimeout: ReturnType<typeof setTimeout> | undefined

const formatPrecio = (value: unknown) => {
  const amount = Number(value ?? 0)
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
    minimumFractionDigits: 2,
  }).format(amount)
}

const loadCatalogos = async () => {
  try {
    const [categoriasResponse, subCategoriasResponse] = await Promise.all([
      categoriasProductoService.listar({ pagina: 1, limite: 100 }),
      subCategoriasProductoService.listar({ pagina: 1, limite: 500 }),
    ])
    categorias.value = categoriasResponse.data
    subCategorias.value = subCategoriasResponse.data
  } catch {
    categorias.value = []
    subCategorias.value = []
  }
}

onMounted(async () => {
  await loadCatalogos()

  const idCategoriaQuery = route.query.idCategoria
  const idSubCategoriaQuery = route.query.idSubCategoria
  const initialFilters: DynamicFilterValues = {}

  if (idCategoriaQuery) {
    initialFilters.idCategoria = Number(idCategoriaQuery)
  }

  if (idSubCategoriaQuery) {
    initialFilters.idSubCategoria = Number(idSubCategoriaQuery)
  }

  if (Object.keys(initialFilters).length) {
    dynamicFilters.value = initialFilters
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
    idSubCategoria:
      active.idSubCategoria != null ? Number(active.idSubCategoria) : undefined,
    esServicio:
      tipoFiltro.value === 'todos' ? undefined : tipoFiltro.value === 'servicio',
    soloActivos: buildSoloActivos(mostrarProductos.value),
    incluirImagenes: true,
  }
}

const onFiltersChange = () => {
  const active = { ...dynamicFilters.value }
  const categoriaId =
    active.idCategoria != null ? Number(active.idCategoria) : null

  if (active.idSubCategoria != null) {
    const subCategoria = subCategorias.value.find(
      (item) => item.id === Number(active.idSubCategoria),
    )

    if (!categoriaId || subCategoria?.id_categoria !== categoriaId) {
      delete active.idSubCategoria
      dynamicFilters.value = active
    }
  }

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

watch(mostrarProductos, () => {
  pagina.value = 1
  syncFilters()
})

watch(tipoFiltro, () => {
  pagina.value = 1
  syncFilters()
})

const openEditView = (producto: Producto) => {
  void router.push({
    name: 'admin-productos-articulos-editar',
    params: { id: producto.id },
  })
}

const openDetailModal = (producto: Producto) => {
  productoToView.value = producto
  detailModalOpen.value = true
}

const openDeleteModal = (producto: Producto) => {
  productoToDelete.value = producto
  deleteModalOpen.value = true
}

const confirmDelete = async () => {
  if (!productoToDelete.value) return

  try {
    await deleteMutation.mutateAsync(productoToDelete.value.id)
    deleteModalOpen.value = false
    productoToDelete.value = null
  } catch {
    // toast en mutation
  }
}

const restaurarProducto = async (producto: Producto) => {
  try {
    await restaurarMutation.mutateAsync({ id: producto.id })
  } catch {
    // toast en mutation
  }
}

function actionItemsForRow(row: Producto): ActionMenuItem[] {
  const busy = restaurarMutation.isPending.value || deleteMutation.isPending.value
  const blockedByStock = Boolean(row.tiene_stock)
  const esSistema = esProductoSistema(row)

  return [
    {
      key: 'edit',
      label: 'Editar',
      icon: ICONS.pencil,
      disabled: busy,
      hidden: !(canEdit.value && row.estado === 1 && !esSistema),
    },
    {
      key: 'restore',
      label: 'Restaurar',
      icon: ICONS.check,
      disabled: busy,
      loading: restaurarMutation.isPending.value,
      hidden: !(canRestore.value && row.estado !== 1 && !esSistema),
    },
    {
      key: 'delete',
      label: blockedByStock ? 'Eliminar (tiene stock)' : 'Eliminar',
      icon: ICONS.trash,
      danger: !blockedByStock,
      disabled: busy || blockedByStock,
      hidden: !(canDelete.value && row.estado === 1 && !esSistema),
    },
  ]
}

function onActionSelect(key: string, row: Producto) {
  switch (key) {
    case 'edit':
      openEditView(row)
      return
    case 'restore':
      return restaurarProducto(row)
    case 'delete':
      openDeleteModal(row)
      return
  }
}
</script>
