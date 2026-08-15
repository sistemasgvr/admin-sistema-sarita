<template>
  <div v-if="!canVerProductos" class="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center dark:border-gray-700 dark:bg-white/[0.03]">
    <div class="flex h-14 w-14 items-center justify-center rounded-full bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
      <AppIcon :name="ICONS.boxes" :size="28" />
    </div>
    <div class="max-w-md space-y-1">
      <h3 class="text-lg font-semibold text-gray-800 dark:text-white/90">Analítica de productos</h3>
      <p class="text-sm text-gray-500 dark:text-gray-400">
        No tienes permisos para ver los indicadores de este módulo.
      </p>
    </div>
    <FiltrosActivosBadge />
  </div>

  <div v-else>
    <section class="mb-6">
      <AppSummaryCards :cards="resumenCards" :columns="4" />
    </section>

    <section class="mb-6 grid gap-4 lg:grid-cols-2">
      <div class="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
        <h3 class="mb-3 text-base font-semibold text-gray-800 dark:text-white/90">
          Distribución de stock valorizado por categoría
        </h3>
        <ApexChart
          type="donut"
          :series="stockCategoriaSeries"
          :options="stockCategoriaOptions"
          :height="300"
        />
      </div>

      <DashboardStockCriticoCard
        :registros="stockCriticoQuery.data.value?.registros ?? []"
        :loading="stockCriticoQuery.isLoading.value"
      />
    </section>

    <section class="mb-6">
      <div class="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
        <h3 class="mb-3 text-base font-semibold text-gray-800 dark:text-white/90">
          Volumen de venta de gases ({{ etiquetaMesActual }} vs {{ etiquetaMesAnterior }})
        </h3>
        <ApexChart
          type="bar"
          :series="gasesComparativoSeries"
          :options="gasesComparativoOptions"
          :height="320"
        />
      </div>
    </section>

    <section>
      <AppTable
        :columns="columnasVelocidad"
        :rows="velocidadSalida"
        :loading="velocidadSalidaQuery.isLoading.value"
        :show-actions="false"
        row-key="idProducto"
        empty-text="No hay productos con movimiento en el periodo."
      >
        <template #toolbar>
          <h3 class="text-base font-semibold text-gray-800 dark:text-white/90">
            Detalle de velocidad de salida
          </h3>
        </template>

        <template #cell-nivelRotacion="{ row }">
          <AppBadge :color="colorNivelRotacion(row.nivelRotacion)" variant="light" size="sm">
            {{ etiquetaNivelRotacion(row.nivelRotacion) }}
            <span v-if="row.rotacion != null">({{ row.rotacion }}x)</span>
          </AppBadge>
        </template>

        <template #cell-margenUnitario="{ value }">
          <span v-if="value != null">{{ Number(value).toFixed(2) }}%</span>
          <span v-else class="text-gray-400 dark:text-gray-500">—</span>
        </template>
      </AppTable>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ApexOptions } from 'apexcharts'
import AppIcon from '@/shared/components/AppIcon.vue'
import { ApexChart, AppBadge, AppSummaryCards, AppTable } from '@/shared/components'
import type { SummaryCardItem } from '@/shared/components/ui/AppSummaryCards.vue'
import type { TableColumn } from '@/shared/interfaces/table.interface'
import type { BadgeColor } from '@/shared/interfaces/badge.interface'
import { ICONS } from '@/shared/constants/icons'
import { PermisoBanderas } from '@/shared/constants/permissions'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { formatCurrency, formatNumber } from '@/shared/utils/currency'
import { MONTH_NAMES } from '@/shared/utils/dateRange'
import FiltrosActivosBadge from '@/modules/dashboard/components/FiltrosActivosBadge.vue'
import DashboardStockCriticoCard from '@/modules/dashboard/components/DashboardStockCriticoCard.vue'
import { useDashboardFiltros } from '@/modules/dashboard/composables/useDashboardFiltros'
import { useDashboardProductosQuery } from '@/modules/dashboard/composables/useDashboardProductosQuery'
import { useDashboardStockCategoriaQuery } from '@/modules/dashboard/composables/useDashboardStockCategoriaQuery'
import { useDashboardStockCriticoQuery } from '@/modules/dashboard/composables/useDashboardStockCriticoQuery'
import { useDashboardVelocidadSalidaQuery } from '@/modules/dashboard/composables/useDashboardVelocidadSalidaQuery'
import { useDashboardGasesComparativoQuery } from '@/modules/dashboard/composables/useDashboardGasesComparativoQuery'
import { rangoDesdeFiltros } from '@/modules/dashboard/utils/dashboard-filtros'
import type { DashboardNivelRotacion } from '@/modules/dashboard/interfaces/dashboard.interface'

const authStore = useAuthStore()
const { filtros } = useDashboardFiltros()

const canVerProductos = computed(() =>
  authStore.hasPermission(PermisoBanderas.DASHBOARD_VER_PRODUCTOS),
)

const rangoFechasParams = computed(() => rangoDesdeFiltros(filtros))

const productosQuery = useDashboardProductosQuery()
const stockCategoriaQuery = useDashboardStockCategoriaQuery()
const stockCriticoQuery = useDashboardStockCriticoQuery({ limite: 5 })
const velocidadSalidaQuery = useDashboardVelocidadSalidaQuery(
  computed(() => ({ ...rangoFechasParams.value, limite: 20 })),
)
const gasesComparativoQuery = useDashboardGasesComparativoQuery()

const resumenCards = computed<SummaryCardItem[]>(() => {
  const data = productosQuery.data.value
  const loading = productosQuery.isLoading.value

  return [
    {
      key: 'productosRegistrados',
      label: 'Productos registrados',
      value: loading ? '—' : formatNumber(data?.totalProductos.total ?? 0),
      hint: loading
        ? undefined
        : `${data?.totalProductos.gases ?? 0} gases · ${data?.totalProductos.accesorios ?? 0} accesorios`,
      icon: ICONS.boxes,
    },
    {
      key: 'almacenesOperativos',
      label: 'Almacenes operativos',
      value: loading ? '—' : formatNumber(data?.totalAlmacenes ?? 0),
      icon: ICONS.warehouse,
    },
    {
      key: 'margenPromedio',
      label: 'Margen promedio',
      value: loading ? '—' : `${(data?.margenPromedio ?? 0).toFixed(2)}%`,
      icon: ICONS.gauge,
    },
    {
      key: 'valorInventario',
      label: 'Valor total inventario',
      value: loading ? '—' : formatCurrency(data?.valorTotalInventario ?? 0),
      icon: ICONS.archive,
    },
  ]
})

const stockCategoriaSeries = computed(
  () => stockCategoriaQuery.data.value?.detalle.map((d) => d.valor) ?? [],
)

const stockCategoriaOptions = computed<ApexOptions>(() => ({
  labels: stockCategoriaQuery.data.value?.detalle.map((d) => d.categoria) ?? [],
  legend: { position: 'bottom' },
  colors: ['#12b76a', '#36bffa', '#f79009', '#7a5af8', '#f04438'],
  dataLabels: {
    enabled: true,
    formatter: (val: number) => `${val.toFixed(0)}%`,
  },
}))

const etiquetaMes = (ref?: { anio: number; mes: number }) => {
  if (!ref) return '—'
  return `${MONTH_NAMES[ref.mes - 1] ?? ''} ${ref.anio}`
}

const etiquetaMesActual = computed(() => etiquetaMes(gasesComparativoQuery.data.value?.mesActual))
const etiquetaMesAnterior = computed(() =>
  etiquetaMes(gasesComparativoQuery.data.value?.mesAnterior),
)

const gasesComparativoSeries = computed(() => {
  const detalle = gasesComparativoQuery.data.value?.detalle ?? []
  return [
    { name: etiquetaMesAnterior.value, data: detalle.map((d) => d.cantidadAnterior) },
    { name: etiquetaMesActual.value, data: detalle.map((d) => d.cantidadActual) },
  ]
})

const gasesComparativoOptions = computed<ApexOptions>(() => ({
  chart: { type: 'bar' },
  xaxis: {
    categories: (gasesComparativoQuery.data.value?.detalle ?? []).map((d) => d.producto),
  },
  plotOptions: { bar: { columnWidth: '55%', borderRadius: 3 } },
  colors: ['#98a2b3', '#039855'],
  legend: { position: 'top', horizontalAlign: 'right' },
}))

const velocidadSalida = computed(() => velocidadSalidaQuery.data.value?.detalle ?? [])

const columnasVelocidad: TableColumn<(typeof velocidadSalida.value)[number]>[] = [
  { key: 'producto', label: 'Producto' },
  { key: 'categoria', label: 'Categoría' },
  {
    key: 'stockActual',
    label: 'Stock actual',
    align: 'right',
    formatter: (value) => formatNumber(value as number),
  },
  { key: 'nivelRotacion', label: 'Rotación', align: 'center' },
  { key: 'margenUnitario', label: 'Margen unit.', align: 'right' },
]

const NIVEL_ROTACION_LABEL: Record<DashboardNivelRotacion, string> = {
  MUY_ALTA: 'Muy alta',
  ALTA: 'Alta',
  MEDIA: 'Media',
  BAJA: 'Baja',
  SIN_STOCK: 'Sin stock',
}

const NIVEL_ROTACION_COLOR: Record<DashboardNivelRotacion, BadgeColor> = {
  MUY_ALTA: 'success',
  ALTA: 'primary',
  MEDIA: 'warning',
  BAJA: 'error',
  SIN_STOCK: 'neutral',
}

const etiquetaNivelRotacion = (nivel: DashboardNivelRotacion) => NIVEL_ROTACION_LABEL[nivel]
const colorNivelRotacion = (nivel: DashboardNivelRotacion) => NIVEL_ROTACION_COLOR[nivel]
</script>
