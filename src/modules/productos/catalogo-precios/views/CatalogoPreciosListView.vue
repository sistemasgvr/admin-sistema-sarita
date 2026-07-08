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
        <div class="flex flex-col gap-4">
          <div v-if="canCreate" class="flex justify-end">
            <button
              type="button"
              class="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white shadow-theme-xs transition hover:bg-brand-600"
              @click="openCreateModal"
            >
              <AppIcon :name="ICONS.plus" :size="18" />
              Nuevo ítem
            </button>
          </div>

          <div class="grid w-full gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <AppSelect
              v-model="idTipoCatalogoFiltro"
              label="Tipo"
              placeholder="Todos"
              :options="tipoCatalogoFilterOptions"
              :disabled="tiposCatalogoQuery.isFetching.value"
            />

            <AppInput v-model="periodoFiltro" label="Periodo" placeholder="2026-Q2" />

            <div class="sm:col-span-2 lg:col-span-1">
              <AppInput
                v-model="buscar"
                label="Buscar"
                type="search"
                placeholder="Nombre, producto o periodo..."
              />
            </div>
          </div>
        </div>
      </template>

      <template #cell-nombre_tipo_catalogo="{ value }">
        <AppBadge variant="light" color="primary">{{ value }}</AppBadge>
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
  AppBadge,
  AppInput,
  AppModal,
  AppPagination,
  AppSelect,
  AppTable,
} from '@/shared/components'
import AppIcon from '@/shared/components/AppIcon.vue'
import { ICONS } from '@/shared/constants/icons'
import { ListaIds } from '@/shared/constants/lista-ids'
import { PermisoBanderas } from '@/shared/constants/permissions'
import type { TableColumn } from '@/shared/interfaces/table.interface'

const authStore = useAuthStore()
const breadcrumbItems = productosBreadcrumbItems('Catálogo de precios')

const listaTipoCatalogoId = ref(ListaIds.TIPO_CATALOGO_PRECIO)
const tiposCatalogoQuery = useListaOpcionesQuery(listaTipoCatalogoId)

const productos = ref<Producto[]>([])

const idTipoCatalogoFiltro = ref<string | number>('')
const periodoFiltro = ref('')
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

const canCreate = computed(() => authStore.hasPermission(PermisoBanderas.CATALOGO_PRECIOS_CREAR))
const canEdit = computed(() => authStore.hasPermission(PermisoBanderas.CATALOGO_PRECIOS_EDITAR))
const canDelete = computed(() => authStore.hasPermission(PermisoBanderas.CATALOGO_PRECIOS_ELIMINAR))

const isLoading = computed(() => catalogoPreciosQuery.isFetching.value)
const rows = computed(() => catalogoPreciosQuery.data.value?.data ?? [])

const tipoCatalogoFilterOptions = computed(() => [
  { value: '', label: 'Todos los tipos' },
  ...(tiposCatalogoQuery.data.value ?? []).map((opcion) => ({
    value: opcion.id,
    label: opcion.nombre,
  })),
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
let periodoTimeout: ReturnType<typeof setTimeout> | undefined

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

watch(idTipoCatalogoFiltro, (value) => {
  pagina.value = 1
  filters.value = {
    ...filters.value,
    idTipoCatalogo: value ? Number(value) : undefined,
    pagina: 1,
  }
})

watch(periodoFiltro, (value) => {
  clearTimeout(periodoTimeout)
  periodoTimeout = setTimeout(() => {
    pagina.value = 1
    filters.value = {
      ...filters.value,
      periodo: value.trim() || undefined,
      pagina: 1,
    }
  }, 350)
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
  selectedCatalogoPrecio.value = null
  formModalOpen.value = true
}

const openEditModal = (catalogoPrecio: CatalogoPrecio) => {
  formMode.value = 'edit'
  selectedCatalogoPrecio.value = catalogoPrecio
  formModalOpen.value = true
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

const onCatalogoPrecioSaved = () => {
  selectedCatalogoPrecio.value = null
}
</script>
