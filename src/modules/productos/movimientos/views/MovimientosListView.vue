<template>
  <div>
    <PageBreadcrumb page-title="Movimientos" :items="breadcrumbItems" />

    <AppTable
      :columns="columns"
      :rows="rows"
      row-key="id"
      :loading="isLoading"
    >
      <template #toolbar>
        <div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div class="flex w-full flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
            <div class="w-full sm:max-w-[10rem]">
              <AppInput
                v-model="fechaDesde"
                label="Desde"
                type="date"
              />
            </div>

            <div class="w-full sm:max-w-[10rem]">
              <AppInput
                v-model="fechaHasta"
                label="Hasta"
                type="date"
              />
            </div>

            <div class="w-full sm:max-w-xs">
              <AppSelect
                v-model="idAlmacenFiltro"
                label="Almacén"
                placeholder="Todos"
                :options="almacenFilterOptions"
                :disabled="isLoadingCatalogos"
              />
            </div>

            <div class="w-full sm:max-w-xs">
              <AppSelect
                v-model="idTipoMovimientoFiltro"
                label="Tipo"
                placeholder="Todos"
                :options="tipoMovimientoFilterOptions"
                :disabled="tiposMovimientoQuery.isFetching.value"
              />
            </div>

            <div class="w-full sm:max-w-sm">
              <AppInput
                v-model="buscar"
                type="search"
                placeholder="Buscar por producto, almacén o glosa..."
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
            Nuevo movimiento
          </button>
        </div>
      </template>

      <template #cell-fecha="{ value }">
        {{ formatFecha(value as string) }}
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

      <template #cell-nombre_tipo_movimiento="{ value }">
        <AppBadge
          variant="light"
          :color="String(value).toUpperCase().includes('SALIDA') ? 'error' : 'success'"
        >
          {{ value }}
        </AppBadge>
      </template>

      <template #cell-cantidad="{ value }">
        <span class="tabular-nums font-medium">{{ formatCantidad(value) }}</span>
      </template>

      <template #cell-stock="{ row }">
        <span
          v-if="row.stock_anterior != null && row.stock_nuevo != null"
          class="tabular-nums text-sm text-gray-600 dark:text-gray-400"
        >
          {{ formatCantidad(row.stock_anterior) }}
          <span class="text-gray-400">→</span>
          {{ formatCantidad(row.stock_nuevo) }}
        </span>
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
          title="Anular"
          class="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm font-medium text-error-500 hover:bg-error-500/10"
          @click="openDeleteModal(row)"
        >
          <AppIcon :name="ICONS.trash" :size="16" />
          <!-- Anular -->
        </button>
      </template>

      <template #footer>
        <AppPagination
          v-model:pagina="pagina"
          v-model:limite="limite"
          :meta="movimientosQuery.data.value?.meta"
          :disabled="isLoading"
        />
      </template>
    </AppTable>

    <MovimientoInventarioFormModal
      v-model="formModalOpen"
      :mode="formMode"
      :movimiento="selectedMovimiento"
      :almacenes="almacenes"
      :productos="productos"
      @saved="onMovimientoSaved"
    />

    <AppModal
      v-model="deleteModalOpen"
      title="Anular movimiento"
      subtitle="Se revertirá el efecto en stock si el producto afecta inventario."
      size="sm"
    >
      <p class="text-sm text-gray-600 dark:text-gray-400">
        ¿Confirmas que deseas anular el movimiento de
        <span class="font-medium text-gray-800 dark:text-white/90">
          {{ movimientoToDelete?.nombre_tipo_movimiento }}
        </span>
        del
        <span class="font-medium text-gray-800 dark:text-white/90">
          {{ formatFecha(movimientoToDelete?.fecha) }}
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
          {{ deleteMutation.isPending.value ? 'Anulando...' : 'Anular' }}
        </button>
      </template>
    </AppModal>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import PageBreadcrumb from '@/modules/admin/components/PageBreadcrumb.vue'
import { useListaOpcionesQuery } from '@/modules/catalogos/composables/useListaOpcionesQuery'
import { almacenesService } from '@/modules/configuracion/almacenes/services/almacenes.service'
import type { Almacen } from '@/modules/configuracion/almacenes/interfaces/almacen.interface'
import { productosService } from '@/modules/productos/articulos/services/productos.service'
import type { Producto } from '@/modules/productos/articulos/interfaces/producto.interface'
import MovimientoInventarioFormModal from '@/modules/productos/movimientos/components/MovimientoInventarioFormModal.vue'
import { useDeleteMovimientoInventarioMutation } from '@/modules/productos/movimientos/composables/useMovimientoInventarioMutations'
import { useMovimientosInventarioQuery } from '@/modules/productos/movimientos/composables/useMovimientosInventarioQuery'
import { productosBreadcrumbItems } from '@/modules/productos/config/productos-breadcrumb'
import type {
  MovimientoInventario,
  MovimientoInventarioFormMode,
  MovimientoInventarioListFilters,
} from '@/modules/productos/movimientos/interfaces/movimiento-inventario.interface'
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
const breadcrumbItems = productosBreadcrumbItems('Movimientos')

const listaTipoMovId = ref(ListaIds.TIPO_MOV_INV)
const tiposMovimientoQuery = useListaOpcionesQuery(listaTipoMovId)

const almacenes = ref<Almacen[]>([])
const productos = ref<Producto[]>([])
const isLoadingCatalogos = ref(false)

const fechaDesde = ref('')
const fechaHasta = ref('')
const idAlmacenFiltro = ref<string | number>('')
const idTipoMovimientoFiltro = ref<string | number>('')
const buscar = ref('')
const pagina = ref(1)
const limite = ref(10)

const filters = ref<MovimientoInventarioListFilters>({
  buscar: '',
  pagina: 1,
  limite: 10,
})

const movimientosQuery = useMovimientosInventarioQuery(filters)
const deleteMutation = useDeleteMovimientoInventarioMutation()

const formModalOpen = ref(false)
const formMode = ref<MovimientoInventarioFormMode>('create')
const selectedMovimiento = ref<MovimientoInventario | null>(null)

const deleteModalOpen = ref(false)
const movimientoToDelete = ref<MovimientoInventario | null>(null)

const canCreate = computed(() => authStore.hasPermission(PermisoBanderas.MOVIMIENTOS_CREAR))
const canEdit = computed(() => authStore.hasPermission(PermisoBanderas.MOVIMIENTOS_EDITAR))
const canDelete = computed(() => authStore.hasPermission(PermisoBanderas.MOVIMIENTOS_ELIMINAR))

const isLoading = computed(() => movimientosQuery.isFetching.value)
const rows = computed(() => movimientosQuery.data.value?.data ?? [])

const almacenFilterOptions = computed(() => [
  { value: '', label: 'Todos' },
  ...almacenes.value.map((almacen) => ({
    value: almacen.id,
    label: almacen.nombre,
  })),
])

const tipoMovimientoFilterOptions = computed(() => [
  { value: '', label: 'Todos' },
  ...(tiposMovimientoQuery.data.value ?? []).map((opcion) => ({
    value: opcion.id,
    label: opcion.nombre,
  })),
])

const columns = computed<TableColumn<MovimientoInventario>[]>(() => [
  { key: 'fecha', label: 'Fecha' },
  { key: 'producto', label: 'Producto' },
  { key: 'nombre_almacen', label: 'Almacén' },
  { key: 'nombre_tipo_movimiento', label: 'Tipo' },
  { key: 'cantidad', label: 'Cantidad' },
  { key: 'stock', label: 'Stock' },
  { key: 'glosa', label: 'Glosa' },
])

let buscarTimeout: ReturnType<typeof setTimeout> | undefined

const formatCantidad = (value: unknown) =>
  new Intl.NumberFormat('es-PE', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 4,
  }).format(Number(value ?? 0))

const formatFecha = (value?: string | null) => {
  if (!value) return '—'
  const date = new Date(`${value.slice(0, 10)}T12:00:00`)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('es-PE', { dateStyle: 'medium' }).format(date)
}

const loadCatalogos = async () => {
  isLoadingCatalogos.value = true
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
    isLoadingCatalogos.value = false
  }
}

onMounted(() => {
  loadCatalogos()
})

const applyDateFilters = () => {
  pagina.value = 1
  filters.value = {
    ...filters.value,
    fechaDesde: fechaDesde.value || undefined,
    fechaHasta: fechaHasta.value || undefined,
    pagina: 1,
  }
}

watch(fechaDesde, applyDateFilters)
watch(fechaHasta, applyDateFilters)

watch(idAlmacenFiltro, (value) => {
  pagina.value = 1
  filters.value = {
    ...filters.value,
    idAlmacen: value ? Number(value) : undefined,
    pagina: 1,
  }
})

watch(idTipoMovimientoFiltro, (value) => {
  pagina.value = 1
  filters.value = {
    ...filters.value,
    idTipoMovimiento: value ? Number(value) : undefined,
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
  selectedMovimiento.value = null
  formModalOpen.value = true
}

const openEditModal = (movimiento: MovimientoInventario) => {
  formMode.value = 'edit'
  selectedMovimiento.value = movimiento
  formModalOpen.value = true
}

const openDeleteModal = (movimiento: MovimientoInventario) => {
  movimientoToDelete.value = movimiento
  deleteModalOpen.value = true
}

const confirmDelete = async () => {
  if (!movimientoToDelete.value) return

  try {
    await deleteMutation.mutateAsync(movimientoToDelete.value.id)
    deleteModalOpen.value = false
    movimientoToDelete.value = null
  } catch {
    // toast en mutation
  }
}

const onMovimientoSaved = () => {
  selectedMovimiento.value = null
}
</script>
