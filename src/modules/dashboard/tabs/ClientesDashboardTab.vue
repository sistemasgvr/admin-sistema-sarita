<template>
  <div class="space-y-6">
    <!-- Estado de error -->
    <div
      v-if="query.isError.value"
      class="flex flex-col items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-10 text-center dark:border-rose-500/30 dark:bg-rose-500/10"
    >
      <AppIcon :name="ICONS.alertTriangle" :size="28" class="text-rose-500" />
      <p class="text-sm text-rose-700 dark:text-rose-300">
        No se pudieron cargar los indicadores de clientes.
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
      <div class="flex items-center justify-end">
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
          label="Clientes activos"
          :value="formatNumber(totalClientes)"
          :icon="ICONS.users"
          tone="blue"
          :loading="isLoading"
        />
        <KpiCard
          label="Clientes al día"
          :value="formatNumber(clientesAlDia)"
          :icon="ICONS.userCheck"
          tone="emerald"
          :loading="isLoading"
        />
        <KpiCard
          label="Clientes con deuda"
          :value="formatNumber(clientesConDeuda)"
          :icon="ICONS.alertTriangle"
          tone="amber"
          :loading="isLoading"
          clickable
          @click="openFocus(null)"
        />
        <KpiCard
          label="Deuda total"
          :value="formatCurrency(deudaTotal)"
          :icon="ICONS.banknote"
          tone="rose"
          :hint="`Promedio ${formatCurrency(deudaPromedio)} por cliente`"
          :loading="isLoading"
          clickable
          @click="openFocus(null)"
        />
      </div>

      <!-- Gráficos -->
      <div class="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <!-- Cartera (donut) -->
        <div
          class="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:col-span-1"
        >
          <h3 class="mb-1 text-base font-semibold text-gray-800 dark:text-white/90">
            Cartera de clientes
          </h3>
          <p class="mb-2 text-xs text-gray-500 dark:text-gray-400">
            Distribución entre clientes al día y con deuda pendiente.
          </p>
          <BaseApexChart
            type="donut"
            :series="carteraSeries"
            :options="carteraOptions"
            :height="300"
          />
        </div>

        <!-- Top deudores (barras) -->
        <div
          class="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:col-span-2"
        >
          <h3 class="mb-1 text-base font-semibold text-gray-800 dark:text-white/90">
            Top clientes por deuda
          </h3>
          <p class="mb-2 text-xs text-gray-500 dark:text-gray-400">
            Los {{ topClientes.length || 10 }} clientes con mayor saldo pendiente.
          </p>
          <div v-if="!topClientes.length && !isLoading" class="py-14 text-center">
            <p class="text-sm text-gray-500 dark:text-gray-400">
              No hay clientes con deuda registrada.
            </p>
          </div>
          <BaseApexChart
            v-else
            type="bar"
            :series="topSeries"
            :options="topOptions"
            :height="Math.max(topClientes.length * 44, 220)"
          />
        </div>
      </div>

      <!-- Detalle de deuda -->
      <div>
        <h3 class="mb-3 text-base font-semibold text-gray-800 dark:text-white/90">
          Detalle de deuda por cliente
        </h3>
        <AppTable
          :columns="columns"
          :rows="detalleOrdenado"
          :loading="isLoading"
          :show-actions="false"
          row-key="idCliente"
          empty-text="No hay clientes con deuda pendiente."
        >
          <template #cell-cliente="{ row }">
            <button
              type="button"
              class="min-w-0 text-left"
              @click="openFocus(row.idCliente)"
            >
              <p class="truncate font-medium text-brand-600 hover:underline dark:text-brand-400">
                {{ displayName(row) }}
              </p>
              <p class="text-theme-xs text-gray-400 dark:text-gray-500">
                {{ row.numeroDocumento || '—' }}
              </p>
            </button>
          </template>

          <template #cell-comprobantes="{ row }">
            <span class="text-gray-600 dark:text-gray-300">
              {{ row.comprobantes.length }}
            </span>
          </template>

          <template #cell-montoTotalDeuda="{ row }">
            <span class="font-semibold text-rose-600 dark:text-rose-400">
              {{ formatCurrency(row.montoTotalDeuda) }}
            </span>
          </template>
        </AppTable>
      </div>
    </template>

    <ClientesDeudaFocusModal
      v-model="focusOpen"
      :clientes="detalleOrdenado"
      :focus-id="focusClienteId"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { ApexOptions, ApexChartEventOpts } from 'apexcharts'
import AppIcon from '@/shared/components/AppIcon.vue'
import { AppTable } from '@/shared/components'
import KpiCard from '@/modules/dashboard/components/KpiCard.vue'
import BaseApexChart from '@/modules/dashboard/components/BaseApexChart.vue'
import ClientesDeudaFocusModal from '@/modules/dashboard/components/ClientesDeudaFocusModal.vue'
import { useClientesDashboardQuery } from '@/modules/dashboard/composables/useClientesDashboardQuery'
import { useDashboardFilters } from '@/modules/dashboard/composables/useDashboardFilters'
import type { ClienteConDeuda } from '@/modules/dashboard/interfaces/dashboard.interface'
import { ICONS } from '@/shared/constants/icons'
import { formatCurrency, formatNumber } from '@/shared/utils/currency'
import type { TableColumn } from '@/shared/interfaces/table.interface'

const filters = useDashboardFilters()
const query = useClientesDashboardQuery(filters)

const isLoading = computed(() => query.isLoading.value)

const totalClientes = computed(() => query.data.value?.totalClientes ?? 0)
const detalle = computed<ClienteConDeuda[]>(
  () => query.data.value?.clientesConDeuda.detalle ?? [],
)
const clientesConDeuda = computed(
  () => query.data.value?.clientesConDeuda.cantidad ?? detalle.value.length,
)
const clientesAlDia = computed(() =>
  Math.max(totalClientes.value - clientesConDeuda.value, 0),
)
const deudaTotal = computed(() =>
  detalle.value.reduce((sum, cliente) => sum + Number(cliente.montoTotalDeuda ?? 0), 0),
)
const deudaPromedio = computed(() =>
  clientesConDeuda.value > 0 ? deudaTotal.value / clientesConDeuda.value : 0,
)

function displayName(cliente: ClienteConDeuda): string {
  return (
    cliente.razonSocial?.trim() ||
    cliente.nombres?.trim() ||
    `Cliente #${cliente.idCliente}`
  )
}

const detalleOrdenado = computed(() =>
  [...detalle.value].sort(
    (a, b) => Number(b.montoTotalDeuda ?? 0) - Number(a.montoTotalDeuda ?? 0),
  ),
)

const topClientes = computed(() => detalleOrdenado.value.slice(0, 10))

/* ---------- Foco interactivo (drill-down) ---------- */
const focusOpen = ref(false)
const focusClienteId = ref<number | null>(null)

const openFocus = (idCliente: number | null) => {
  focusClienteId.value = idCliente
  focusOpen.value = true
}

/* ---------- Donut: cartera de clientes ---------- */
const carteraSeries = computed(() => [clientesConDeuda.value, clientesAlDia.value])

const carteraOptions = computed<ApexOptions>(() => ({
  labels: ['Con deuda', 'Al día'],
  colors: ['#f59e0b', '#10b981'],
  legend: { position: 'bottom' },
  chart: {
    events: {
      dataPointSelection: (_e, _ctx, cfg?: ApexChartEventOpts) => {
        if (cfg?.dataPointIndex === 0) openFocus(null)
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
            label: 'Clientes',
            formatter: () => formatNumber(totalClientes.value),
          },
        },
      },
    },
  },
  tooltip: {
    y: { formatter: (val: number) => `${formatNumber(val)} clientes` },
  },
}))

/* ---------- Barras: top deudores ---------- */
const topSeries = computed(() => [
  {
    name: 'Deuda',
    data: topClientes.value.map((cliente) => Number(cliente.montoTotalDeuda ?? 0)),
  },
])

const topOptions = computed<ApexOptions>(() => ({
  chart: {
    type: 'bar',
    events: {
      dataPointSelection: (_e, _ctx, cfg?: ApexChartEventOpts) => {
        const cliente = cfg ? topClientes.value[cfg.dataPointIndex] : undefined
        if (cliente) openFocus(cliente.idCliente)
      },
    },
  },
  colors: ['#3b82f6'],
  plotOptions: {
    bar: {
      horizontal: true,
      borderRadius: 4,
      borderRadiusApplication: 'end',
      barHeight: '60%',
    },
  },
  xaxis: {
    categories: topClientes.value.map(displayName),
    labels: { formatter: (val: string) => formatCurrency(Number(val)) },
  },
  tooltip: {
    y: { formatter: (val: number) => formatCurrency(val) },
  },
}))

/* ---------- Tabla ---------- */
const columns: TableColumn<ClienteConDeuda>[] = [
  { key: 'cliente', label: 'Cliente' },
  { key: 'comprobantes', label: 'Comprobantes', align: 'center' },
  { key: 'montoTotalDeuda', label: 'Deuda total', align: 'right' },
]
</script>
