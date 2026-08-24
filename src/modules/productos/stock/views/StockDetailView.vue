<template>
  <div>
    <PageBreadcrumb :page-title="pageTitle" :items="breadcrumbItems" />

    <div class="mb-5 flex flex-wrap items-center gap-2">
      <RouterLink
        :to="{ name: 'admin-productos-stock' }"
        class="inline-flex items-center gap-1 text-sm font-medium text-gray-500 transition hover:text-gray-800 dark:text-gray-400 dark:hover:text-white/90"
      >
        <AppIcon :name="ICONS.chevronLeft" :size="16" />
        Volver al stock
      </RouterLink>
      <AppHelpTip
        text="Aquí ves el saldo actual y el historial. Ajusta o traslada desde aquí. Los ingresos entran por Compras y las salidas por Ventas."
      />
    </div>

    <div
      v-if="stockQuery.isError.value"
      class="rounded-xl border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-300"
    >
      No se pudo cargar el detalle de stock.
    </div>

    <DetailCardsLayout v-else :loading="isLoading" :sections="sections">
      <template #badges>
        <AppBadge v-if="stock?.bajo_minimo" color="error">Bajo mínimo</AppBadge>
        <AppBadge v-else-if="stock" color="success">OK</AppBadge>
        <AppBadge
          v-if="stock?.nombre_categoria"
          size="sm"
          variant="light"
          color="neutral"
        >
          {{ stock.nombre_categoria }}
        </AppBadge>
        <AppBadge
          v-if="stock?.nombre_sub_categoria"
          size="sm"
          variant="light"
          color="primary"
        >
          {{ stock.nombre_sub_categoria }}
        </AppBadge>
        <AppBadge v-if="stock?.nombre_unidad_medida" size="sm" variant="light" color="neutral">
          {{ stock.nombre_unidad_medida }}
        </AppBadge>
      </template>

      <template #extra>
        <DetailSectionCard title="Acciones" :icon="ICONS.boxes" full-width>
          <div class="flex flex-wrap gap-2">
            <RouterLink
              v-if="canCreateMovimiento && stock"
              class="inline-flex items-center gap-1.5 rounded-lg bg-brand-500 px-3 py-2 text-sm font-medium text-white transition hover:bg-brand-600"
              :to="ajusteTo"
            >
              <AppIcon :name="ICONS.pencil" :size="16" />
              Ajuste
            </RouterLink>
            <RouterLink
              v-if="canCreateMovimiento && stock"
              class="inline-flex items-center gap-1.5 rounded-lg bg-brand-500 px-3 py-2 text-sm font-medium text-white transition hover:bg-brand-600"
              :to="trasladoTo"
            >
              <AppIcon :name="ICONS.arrowLeftRight" :size="16" />
              Traslado
            </RouterLink>
            <RouterLink
              v-if="canListMovimientos && stock"
              class="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-white/[0.03]"
              :to="historialTo"
            >
              <AppIcon :name="ICONS.history" :size="16" />
              Historial en movimientos
            </RouterLink>
            <button
              v-if="canEdit && stock"
              type="button"
              class="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-white/[0.03]"
              @click="minimoModalOpen = true"
            >
              <AppIcon :name="ICONS.gauge" :size="16" />
              Stock mínimo
            </button>
          </div>
        </DetailSectionCard>

        <DetailSectionCard title="Historial de movimientos" :icon="ICONS.history" full-width>
          <div v-if="isLoadingMovimientos" class="text-sm text-gray-500 dark:text-gray-400">
            Cargando movimientos...
          </div>
          <div
            v-else-if="!movimientos.length"
            class="text-sm text-gray-500 dark:text-gray-400"
          >
            Aún no hay movimientos para este producto en el almacén.
          </div>
          <div v-else class="overflow-x-auto">
            <table class="min-w-full text-sm">
              <thead>
                <tr
                  class="border-b border-gray-100 text-left text-theme-xs uppercase text-gray-500 dark:border-gray-800"
                >
                  <th class="pb-2 pr-4">Fecha</th>
                  <th class="pb-2 pr-4">Tipo</th>
                  <th class="pb-2 pr-4">Cantidad</th>
                  <th class="pb-2 pr-4">Stock ant. / nuevo</th>
                  <th class="pb-2">Glosa</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="mov in movimientos"
                  :key="mov.id"
                  class="border-b border-gray-50 dark:border-gray-800/80"
                >
                  <td class="py-2.5 pr-4 whitespace-nowrap text-gray-700 dark:text-gray-300">
                    {{ formatFecha(mov.fecha) }}
                  </td>
                  <td class="py-2.5 pr-4 whitespace-nowrap">
                    <ListaOpcionBadge :value="mov.nombre_tipo_movimiento" />
                  </td>
                  <td class="py-2.5 pr-4 tabular-nums font-medium text-gray-800 dark:text-white/90">
                    {{ formatCantidad(mov.cantidad, mov.nombre_unidad_medida, mov.es_gas) }}
                  </td>
                  <td class="py-2.5 pr-4 tabular-nums text-theme-xs text-gray-600 dark:text-gray-400">
                    {{ formatCantidad(mov.stock_anterior, mov.nombre_unidad_medida, mov.es_gas) }}
                    /
                    {{ formatCantidad(mov.stock_nuevo, mov.nombre_unidad_medida, mov.es_gas) }}
                  </td>
                  <td class="py-2.5 text-gray-600 dark:text-gray-400">
                    {{ mov.glosa || '—' }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </DetailSectionCard>
      </template>
    </DetailCardsLayout>

    <StockFormModal
      v-model="minimoModalOpen"
      :stock="stock"
      @saved="onMinimoSaved"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import PageBreadcrumb from '@/modules/admin/components/PageBreadcrumb.vue'
import { productosStockBreadcrumbItems } from '@/modules/productos/config/productos-breadcrumb'
import { movimientosInventarioService } from '@/modules/productos/movimientos/services/movimientos-inventario.service'
import type { MovimientoInventario } from '@/modules/productos/movimientos/interfaces/movimiento-inventario.interface'
import StockFormModal from '@/modules/productos/stock/components/StockFormModal.vue'
import { useStockByIdQuery } from '@/modules/productos/stock/composables/useStockQuery'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import DetailCardsLayout from '@/shared/components/detail/DetailCardsLayout.vue'
import DetailSectionCard from '@/shared/components/detail/DetailSectionCard.vue'
import {
  formatDetailCantidad,
  formatDetailDateTime,
} from '@/shared/components/detail/detailFormatters'
import type { DetailSection } from '@/shared/components/detail/detail.types'
import { AppBadge, AppHelpTip, ListaOpcionBadge } from '@/shared/components'
import AppIcon from '@/shared/components/AppIcon.vue'
import { ICONS } from '@/shared/constants/icons'
import { PermisoBanderas } from '@/shared/constants/permissions'
import { formatCantidadPorUnidad } from '@/shared/utils/unidadMedidaCantidad'

const route = useRoute()
const authStore = useAuthStore()

const stockId = computed(() => {
  const raw = Number(route.params.id)
  return Number.isFinite(raw) && raw > 0 ? raw : null
})

const stockQuery = useStockByIdQuery(stockId)
const stock = computed(() => stockQuery.data.value ?? null)
const isLoading = computed(() => stockQuery.isLoading.value)

const pageTitle = computed(() => stock.value?.nombre_producto || 'Detalle de stock')
const breadcrumbItems = computed(() => productosStockBreadcrumbItems(pageTitle.value))

const movimientos = ref<MovimientoInventario[]>([])
const isLoadingMovimientos = ref(false)
const minimoModalOpen = ref(false)

const canCreateMovimiento = computed(() =>
  authStore.hasPermission(PermisoBanderas.MOVIMIENTOS_CREAR),
)
const canListMovimientos = computed(() =>
  authStore.hasPermission(PermisoBanderas.MOVIMIENTOS_LISTAR),
)
const canEdit = computed(() => authStore.hasPermission(PermisoBanderas.STOCK_EDITAR))

const historialTo = computed(() => ({
  name: 'admin-productos-movimientos',
  query: {
    idProducto: stock.value ? String(stock.value.id_producto) : undefined,
    idAlmacen: stock.value ? String(stock.value.id_almacen) : undefined,
  },
}))

const ajusteTo = computed(() => ({
  name: 'admin-productos-movimientos-nuevo',
  query: {
    tipo: 'AJUSTE',
    idProducto: stock.value ? String(stock.value.id_producto) : undefined,
    idAlmacen: stock.value ? String(stock.value.id_almacen) : undefined,
  },
}))

const trasladoTo = computed(() => ({
  name: 'admin-productos-movimientos-nuevo',
  query: {
    tipo: 'TRASLADO',
    idProducto: stock.value ? String(stock.value.id_producto) : undefined,
    idAlmacen: stock.value ? String(stock.value.id_almacen) : undefined,
  },
}))

const sections = computed<DetailSection[]>(() => {
  const data = stock.value
  if (!data) return []

  return [
    {
      title: 'Ubicación',
      icon: ICONS.warehouse,
      items: [
        { label: 'Almacén', value: data.nombre_almacen },
        { label: 'Sucursal', value: data.nombre_sucursal },
      ],
    },
    {
      title: 'Producto',
      icon: ICONS.package,
      items: [
        { label: 'Producto', value: data.nombre_producto },
        { label: 'Código', value: data.codigo_producto },
        { label: 'Categoría', value: data.nombre_categoria },
        { label: 'Subcategoría', value: data.nombre_sub_categoria },
        { label: 'Unidad de medida', value: data.nombre_unidad_medida },
      ],
    },
    {
      title: 'Saldo actual',
      icon: ICONS.boxes,
      items: [
        {
          label: 'Stock actual',
          value: formatDetailCantidad(data.stock),
        },
        {
          label: 'Stock mínimo',
          value: formatDetailCantidad(data.stock_minimo),
        },
      ],
    },
    {
      title: 'Auditoría',
      icon: ICONS.userCircle,
      items: [
        { label: 'Fecha creación', value: formatDetailDateTime(data.fecha_creacion) },
        { label: 'Última modificación', value: formatDetailDateTime(data.fecha_modificacion) },
      ],
    },
  ]
})

const formatCantidad = (
  value: unknown,
  nombreUnidad?: string | null,
  esGas?: boolean | null,
) => formatCantidadPorUnidad(value, nombreUnidad, esGas)

const formatFecha = (value?: string | null) => {
  if (!value) return '—'
  const date = new Date(`${value.slice(0, 10)}T12:00:00`)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('es-PE', { dateStyle: 'medium' }).format(date)
}

const loadMovimientos = async () => {
  const data = stock.value
  if (!data) {
    movimientos.value = []
    return
  }

  isLoadingMovimientos.value = true
  try {
    const response = await movimientosInventarioService.listar({
      idProducto: data.id_producto,
      idAlmacen: data.id_almacen,
      pagina: 1,
      limite: 30,
    })
    movimientos.value = response.data
  } catch {
    movimientos.value = []
  } finally {
    isLoadingMovimientos.value = false
  }
}

watch(
  () => stock.value?.id,
  (id) => {
    if (id) void loadMovimientos()
  },
  { immediate: true },
)

const onMinimoSaved = () => {
  void stockQuery.refetch()
}
</script>
