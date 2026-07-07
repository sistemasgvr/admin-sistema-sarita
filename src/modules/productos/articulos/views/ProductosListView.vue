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
        <div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div class="flex w-full flex-col gap-3 sm:flex-row sm:items-end">
            <div class="w-full sm:max-w-xs">
              <AppSelect
                v-model="idCategoriaFiltro"
                label="Categoría"
                placeholder="Todas las categorías"
                :options="categoriaFilterOptions"
              />
            </div>

            <div class="w-full sm:max-w-xs">
              <AppSelect
                v-model="idSubCategoriaFiltro"
                label="Subcategoría"
                placeholder="Todas las subcategorías"
                :disabled="!idCategoriaFiltro"
                :options="subCategoriaFilterOptions"
              />
            </div>

            <div class="w-full sm:max-w-sm">
              <AppInput
                v-model="buscar"
                type="search"
                placeholder="Buscar por código, nombre o marca..."
              />
            </div>
          </div>

          <button
            v-if="canCreate"
            type="button"
            class="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white shadow-theme-xs transition hover:bg-brand-600"
            @click="openCreateModal"
          >
            <AppIcon :name="ICONS.plus" :size="18" />
            Nuevo producto
          </button>
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

      <template #cell-precio="{ value }">
        <span class="tabular-nums">
          {{ formatPrecio(value) }}
        </span>
      </template>

      <template #cell-es_gas="{ value }">
        <AppBadge v-if="value" variant="light" color="primary">Gas</AppBadge>
        <span v-else class="text-gray-400">—</span>
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
          :meta="productosQuery.data.value?.meta"
          :disabled="isLoading"
        />
      </template>
    </AppTable>

    <ProductoFormModal
      v-model="formModalOpen"
      :mode="formMode"
      :producto="selectedProducto"
      :categorias="categorias"
      :sub-categorias="subCategorias"
      @saved="onProductoSaved"
    />

    <AppModal
      v-model="deleteModalOpen"
      title="Eliminar producto"
      subtitle="No se puede eliminar si tiene stock distinto de cero."
      size="sm"
    >
      <p class="text-sm text-gray-600 dark:text-gray-400">
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
import { useRoute } from 'vue-router'
import PageBreadcrumb from '@/modules/admin/components/PageBreadcrumb.vue'
import ProductoFormModal from '@/modules/productos/articulos/components/ProductoFormModal.vue'
import { useDeleteProductoMutation } from '@/modules/productos/articulos/composables/useProductoMutations'
import { useProductosQuery } from '@/modules/productos/articulos/composables/useProductosQuery'
import type {
  Producto,
  ProductoFormMode,
  ProductoListFilters,
} from '@/modules/productos/articulos/interfaces/producto.interface'
import { categoriasProductoService } from '@/modules/productos/categorias/services/categorias-producto.service'
import type { CategoriaProducto } from '@/modules/productos/categorias/interfaces/categoria-producto.interface'
import { productosBreadcrumbItems } from '@/modules/productos/config/productos-breadcrumb'
import { subCategoriasProductoService } from '@/modules/productos/sub-categorias/services/sub-categorias-producto.service'
import type { SubCategoriaProducto } from '@/modules/productos/sub-categorias/interfaces/sub-categoria-producto.interface'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { AppBadge, AppInput, AppModal, AppPagination, AppSelect, AppTable } from '@/shared/components'
import AppIcon from '@/shared/components/AppIcon.vue'
import { ICONS } from '@/shared/constants/icons'
import { PermisoBanderas } from '@/shared/constants/permissions'
import type { TableColumn } from '@/shared/interfaces/table.interface'

const authStore = useAuthStore()
const route = useRoute()
const breadcrumbItems = productosBreadcrumbItems('Productos')

const categorias = ref<CategoriaProducto[]>([])
const subCategorias = ref<SubCategoriaProducto[]>([])

const idCategoriaFiltro = ref<string | number>('')
const idSubCategoriaFiltro = ref<string | number>('')
const buscar = ref('')
const pagina = ref(1)
const limite = ref(10)

const filters = ref<ProductoListFilters>({
  buscar: '',
  pagina: 1,
  limite: 10,
})

const productosQuery = useProductosQuery(filters)
const deleteMutation = useDeleteProductoMutation()

const formModalOpen = ref(false)
const formMode = ref<ProductoFormMode>('create')
const selectedProducto = ref<Producto | null>(null)

const deleteModalOpen = ref(false)
const productoToDelete = ref<Producto | null>(null)

const canCreate = computed(() => authStore.hasPermission(PermisoBanderas.PRODUCTOS_CREAR))
const canEdit = computed(() => authStore.hasPermission(PermisoBanderas.PRODUCTOS_EDITAR))
const canDelete = computed(() => authStore.hasPermission(PermisoBanderas.PRODUCTOS_ELIMINAR))

const isLoading = computed(() => productosQuery.isFetching.value)
const rows = computed(() => productosQuery.data.value?.data ?? [])

const categoriaFilterOptions = computed(() => [
  { value: '', label: 'Todas las categorías' },
  ...categorias.value.map((categoria) => ({
    value: categoria.id,
    label: categoria.nombre,
  })),
])

const subCategoriaFilterOptions = computed(() => {
  const categoriaId = idCategoriaFiltro.value ? Number(idCategoriaFiltro.value) : null

  return [
    { value: '', label: 'Todas las subcategorías' },
    ...subCategorias.value
      .filter((subCategoria) =>
        categoriaId ? subCategoria.id_categoria === categoriaId : true,
      )
      .map((subCategoria) => ({
        value: subCategoria.id,
        label: subCategoria.nombre,
      })),
  ]
})

const columns = computed<TableColumn<Producto>[]>(() => [
  { key: 'codigo', label: 'Código' },
  { key: 'nombre', label: 'Nombre' },
  { key: 'categoria', label: 'Categoría' },
  { key: 'nombre_unidad_medida', label: 'U.M.' },
  { key: 'precio', label: 'Precio' },
  { key: 'es_gas', label: 'Tipo' },
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

  if (idCategoriaQuery) {
    idCategoriaFiltro.value = Number(idCategoriaQuery)
  }

  if (idSubCategoriaQuery) {
    idSubCategoriaFiltro.value = Number(idSubCategoriaQuery)
  }
})

watch(idCategoriaFiltro, (value) => {
  const categoriaId = value ? Number(value) : null

  if (idSubCategoriaFiltro.value) {
    const subCategoria = subCategorias.value.find(
      (item) => item.id === Number(idSubCategoriaFiltro.value),
    )

    if (!categoriaId || subCategoria?.id_categoria !== categoriaId) {
      idSubCategoriaFiltro.value = ''
    }
  }

  pagina.value = 1
  filters.value = {
    ...filters.value,
    idCategoria: categoriaId ?? undefined,
    idSubCategoria: idSubCategoriaFiltro.value
      ? Number(idSubCategoriaFiltro.value)
      : undefined,
    pagina: 1,
  }
})

watch(idSubCategoriaFiltro, (value) => {
  pagina.value = 1
  filters.value = {
    ...filters.value,
    idSubCategoria: value ? Number(value) : undefined,
    pagina: 1,
  }
})

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
  selectedProducto.value = null
  formModalOpen.value = true
}

const openEditModal = (producto: Producto) => {
  formMode.value = 'edit'
  selectedProducto.value = producto
  formModalOpen.value = true
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

const onProductoSaved = () => {
  selectedProducto.value = null
}
</script>
