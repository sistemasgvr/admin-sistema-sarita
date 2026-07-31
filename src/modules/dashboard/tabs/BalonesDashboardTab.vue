<template>
  <div class="space-y-6">
    <!-- Estado de error -->
    <div
      v-if="query.isError.value"
      class="flex flex-col items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-10 text-center dark:border-rose-500/30 dark:bg-rose-500/10"
    >
      <AppIcon :name="ICONS.alertTriangle" :size="28" class="text-rose-500" />
      <p class="text-sm text-rose-700 dark:text-rose-300">
        No se pudieron cargar los indicadores de balones.
      </p>
      <button
        type="button"
        class="inline-flex items-center gap-2 rounded-lg border border-rose-300 px-3 py-1.5 text-sm font-medium text-rose-700 hover:bg-rose-100 dark:border-rose-500/40 dark:text-rose-300 dark:hover:bg-rose-500/20"
        @click="query.refetch()"
      >
        <AppIcon :name="ICONS.refreshCw" :size="16" />
        Reintentar
      </button>
    </div>

    <template v-else>
      <!-- Barra de acciones -->
      <div class="flex flex-wrap items-center justify-between gap-2">
        <p
          v-if="filters.fechaDesde || filters.fechaHasta"
          class="text-xs text-gray-400 dark:text-gray-500"
        >
          El rango de fechas no aplica a este panel (estado actual); sí se aplica el filtro de cliente.
        </p>
        <span v-else></span>
        <button
          type="button"
          class="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50 disabled:opacity-60 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/[0.06]"
          :disabled="query.isFetching.value"
          @click="query.refetch()"
        >
          <AppIcon
            :name="ICONS.refreshCw"
            :size="16"
            :class="{ 'animate-spin': query.isFetching.value }"
          />
          Actualizar
        </button>
      </div>

      <!-- KPIs -->
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Total de balones"
          :value="formatNumber(totalBalones)"
          :icon="ICONS.cylinder"
          tone="blue"
          :loading="isLoading"
        />
        <KpiCard
          label="En almacén"
          :value="formatNumber(enAlmacen)"
          :icon="ICONS.warehouse"
          tone="emerald"
          :loading="isLoading"
          clickable
          @click="openGrupo('almacen')"
        />
        <KpiCard
          label="Prestados"
          :value="formatNumber(prestados)"
          :icon="ICONS.users"
          tone="amber"
          :loading="isLoading"
          clickable
          @click="openGrupo('prestados')"
        />
        <KpiCard
          label="Alquilados"
          :value="formatNumber(alquilados)"
          :icon="ICONS.arrowLeftRight"
          tone="indigo"
          :loading="isLoading"
          clickable
          @click="openGrupo('alquilados')"
        />
      </div>

      <!-- Gráficos -->
      <div class="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <!-- Distribución por estado -->
        <div
          class="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:col-span-1"
        >
          <h3 class="mb-1 text-base font-semibold text-gray-800 dark:text-white/90">
            Distribución por estado
          </h3>
          <p class="mb-2 text-xs text-gray-500 dark:text-gray-400">
            Ubicación actual de los cilindros activos.
          </p>
          <BaseApexChart
            type="donut"
            :series="distribucionSeries"
            :options="distribucionOptions"
            :height="300"
          />
        </div>

        <!-- PH por vencer -->
        <div
          class="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:col-span-2"
        >
          <div class="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 class="text-base font-semibold text-gray-800 dark:text-white/90">
                Pruebas hidrostáticas por vencer
              </h3>
              <p class="text-xs text-gray-500 dark:text-gray-400">
                {{ formatNumber(phCantidad) }} cilindro(s) requieren atención.
              </p>
            </div>
            <div class="w-full sm:w-44">
              <AppSelect v-model="diasAlerta" :options="diasAlertaOptions" />
            </div>
          </div>

          <AppTable
            :columns="phColumns"
            :rows="phDetalle"
            :loading="isLoading"
            :show-actions="false"
            row-key="idBalon"
            empty-text="No hay pruebas hidrostáticas por vencer en el rango seleccionado."
          >
            <template #cell-fechaProximaPh="{ row }">
              {{ formatListDate(row.fechaProximaPh) }}
            </template>
            <template #cell-diasRestantes="{ row }">
              <AppBadge :color="row.vencido ? 'error' : 'warning'" size="sm">
                {{ row.vencido ? `Vencido (${Math.abs(row.diasRestantes)} d.)` : `${row.diasRestantes} d.` }}
              </AppBadge>
            </template>
          </AppTable>
        </div>
      </div>
    </template>

    <BalonesGrupoFocusModal
      v-model="grupoModalOpen"
      :title="grupoActivo.title"
      :columns="grupoActivo.columns"
      :rows="grupoActivo.rows"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { ApexOptions, ApexChartEventOpts } from 'apexcharts'
import AppIcon from '@/shared/components/AppIcon.vue'
import { AppBadge, AppSelect, AppTable } from '@/shared/components'
import KpiCard from '@/modules/dashboard/components/KpiCard.vue'
import BaseApexChart from '@/modules/dashboard/components/BaseApexChart.vue'
import BalonesGrupoFocusModal from '@/modules/dashboard/components/BalonesGrupoFocusModal.vue'
import { useBalonesDashboardQuery } from '@/modules/dashboard/composables/useBalonesDashboardQuery'
import { useDashboardFilters } from '@/modules/dashboard/composables/useDashboardFilters'
import type { BalonPhPorVencer } from '@/modules/dashboard/interfaces/dashboard.interface'
import { ICONS } from '@/shared/constants/icons'
import { formatNumber } from '@/shared/utils/currency'
import { formatListDate } from '@/shared/utils/date'
import type { SelectOption } from '@/shared/interfaces/form.interface'
import type { TableColumn } from '@/shared/interfaces/table.interface'

const diasAlerta = ref(30)
const diasAlertaOptions: SelectOption[] = [
  { label: 'Próximos 15 días', value: 15 },
  { label: 'Próximos 30 días', value: 30 },
  { label: 'Próximos 60 días', value: 60 },
  { label: 'Próximos 90 días', value: 90 },
]

const filters = useDashboardFilters()
const idCliente = computed(() => filters.value.idCliente)
const query = useBalonesDashboardQuery(diasAlerta, idCliente)

const isLoading = computed(() => query.isLoading.value)

const totalBalones = computed(() => query.data.value?.totalBalones ?? 0)
const enAlmacen = computed(() => query.data.value?.enAlmacen.cantidad ?? 0)
const prestados = computed(() => query.data.value?.prestados.cantidad ?? 0)
const alquilados = computed(() => query.data.value?.alquilados.cantidad ?? 0)
const mantenimiento = computed(() => query.data.value?.mantenimiento.cantidad ?? 0)

const phCantidad = computed(() => query.data.value?.phPorVencer.cantidad ?? 0)
const phDetalle = computed<BalonPhPorVencer[]>(
  () => query.data.value?.phPorVencer.detalle ?? [],
)

/* ---------- Donut: distribución por estado ---------- */
const distribucionSeries = computed(() => [
  enAlmacen.value,
  prestados.value,
  alquilados.value,
  mantenimiento.value,
])

const distribucionTotal = computed(
  () => enAlmacen.value + prestados.value + alquilados.value + mantenimiento.value,
)

const distribucionOptions = computed<ApexOptions>(() => ({
  labels: ['En almacén', 'Prestados', 'Alquilados', 'Mantenimiento'],
  colors: ['#10b981', '#f59e0b', '#6366f1', '#94a3b8'],
  legend: { position: 'bottom' },
  chart: {
    events: {
      dataPointSelection: (_e, _ctx, cfg?: ApexChartEventOpts) => {
        const claves = ['almacen', 'prestados', 'alquilados', 'mantenimiento'] as const
        const clave = cfg ? claves[cfg.dataPointIndex] : undefined
        if (clave) openGrupo(clave)
      },
    },
  },
  plotOptions: {
    pie: {
      donut: {
        size: '68%',
        labels: {
          show: true,
          total: {
            show: true,
            label: 'Ubicados',
            formatter: () => formatNumber(distribucionTotal.value),
          },
        },
      },
    },
  },
  tooltip: {
    y: { formatter: (val: number) => `${formatNumber(val)} balones` },
  },
}))

/* ---------- Tabla PH ---------- */
const phColumns: TableColumn<BalonPhPorVencer>[] = [
  { key: 'codigoBalon', label: 'Código' },
  { key: 'tipoBalon', label: 'Tipo' },
  { key: 'fechaProximaPh', label: 'Próxima PH' },
  { key: 'diasRestantes', label: 'Estado', align: 'center' },
]

/* ---------- Foco interactivo por grupo ---------- */
type GrupoKey = 'almacen' | 'prestados' | 'alquilados' | 'mantenimiento'

const enAlmacenDetalle = computed(() => query.data.value?.enAlmacen.detalle ?? [])
const prestadosDetalle = computed(() => query.data.value?.prestados.detalle ?? [])
const alquiladosDetalle = computed(() => query.data.value?.alquilados.detalle ?? [])
const mantenimientoDetalle = computed(() => query.data.value?.mantenimiento.detalle ?? [])

const fecha = (v: unknown) => formatListDate(v as string | null)

const columnasAlmacen: TableColumn<Record<string, unknown>>[] = [
  { key: 'codigoBalon', label: 'Código' },
  { key: 'tipoBalon', label: 'Tipo' },
  { key: 'almacen', label: 'Almacén' },
]
const columnasPrestados: TableColumn<Record<string, unknown>>[] = [
  { key: 'codigoBalon', label: 'Código' },
  { key: 'tipoBalon', label: 'Tipo' },
  { key: 'cliente', label: 'Cliente' },
  { key: 'fechaPrestamo', label: 'Préstamo', formatter: fecha },
  { key: 'fechaVencimiento', label: 'Vence', formatter: fecha },
]
const columnasAlquilados: TableColumn<Record<string, unknown>>[] = [
  { key: 'codigoBalon', label: 'Código' },
  { key: 'tipoBalon', label: 'Tipo' },
  { key: 'cliente', label: 'Cliente' },
  { key: 'fechaInicio', label: 'Inicio', formatter: fecha },
  { key: 'fechaFinPactada', label: 'Fin pactado', formatter: fecha },
]
const columnasMantenimiento: TableColumn<Record<string, unknown>>[] = [
  { key: 'codigoBalon', label: 'Código' },
  { key: 'tipoBalon', label: 'Tipo' },
  { key: 'tipoMantenimiento', label: 'Mantenimiento' },
  { key: 'fechaIngreso', label: 'Ingreso', formatter: fecha },
  { key: 'esExterno', label: 'Lugar', formatter: (v) => (v ? 'Externo' : 'Interno') },
]

const grupoModalOpen = ref(false)
const grupoKey = ref<GrupoKey>('almacen')

const openGrupo = (key: GrupoKey) => {
  grupoKey.value = key
  grupoModalOpen.value = true
}

const grupoActivo = computed(() => {
  switch (grupoKey.value) {
    case 'prestados':
      return {
        title: 'Balones prestados',
        columns: columnasPrestados,
        rows: prestadosDetalle.value as unknown as Record<string, unknown>[],
      }
    case 'alquilados':
      return {
        title: 'Balones alquilados',
        columns: columnasAlquilados,
        rows: alquiladosDetalle.value as unknown as Record<string, unknown>[],
      }
    case 'mantenimiento':
      return {
        title: 'Balones en mantenimiento',
        columns: columnasMantenimiento,
        rows: mantenimientoDetalle.value as unknown as Record<string, unknown>[],
      }
    default:
      return {
        title: 'Balones en almacén',
        columns: columnasAlmacen,
        rows: enAlmacenDetalle.value as unknown as Record<string, unknown>[],
      }
  }
})
</script>
