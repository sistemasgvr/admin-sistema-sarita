<template>
  <div v-if="!tieneAccesos" class="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center dark:border-gray-700 dark:bg-white/[0.03]">
    <div class="flex h-14 w-14 items-center justify-center rounded-full bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
      <AppIcon :name="ICONS.users" :size="28" />
    </div>
    <div class="max-w-md space-y-1">
      <h3 class="text-lg font-semibold text-gray-800 dark:text-white/90">Gestión de clientes</h3>
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
      <DashboardTopClientesDeudaCard
        :clientes="clientesConDeuda"
        :loading="clientesQuery.isLoading.value"
        :limite="10"
        titulo="Top 10 clientes con mayor deuda"
      />

      <div class="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
        <div class="mb-4 flex items-center gap-2">
          <AppIcon :name="ICONS.trendingUp" :size="18" class="text-gray-500 dark:text-gray-400" />
          <h3 class="text-base font-semibold text-gray-800 dark:text-white/90">
            Top clientes por volumen de venta
          </h3>
        </div>

        <div v-if="topClientesVentaQuery.isLoading.value" class="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
          Cargando…
        </div>
        <div
          v-else-if="!topClientesVenta.length"
          class="py-8 text-center text-sm text-gray-500 dark:text-gray-400"
        >
          Sin ventas registradas en el periodo.
        </div>
        <ul v-else class="space-y-4">
          <li v-for="cliente in topClientesVenta" :key="cliente.idCliente">
            <div class="mb-1.5 flex items-center justify-between gap-3">
              <p class="truncate text-theme-sm font-medium text-gray-700 dark:text-gray-200">
                {{ cliente.cliente }}
              </p>
              <p class="shrink-0 text-theme-sm font-semibold text-gray-800 dark:text-white/90">
                {{ formatCurrency(cliente.totalVenta) }}
              </p>
            </div>
            <div class="h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-white/10">
              <div
                class="h-full rounded-full bg-brand-500 dark:bg-brand-400"
                :style="{ width: `${porcentajeVenta(cliente.totalVenta)}%` }"
              />
            </div>
          </li>
        </ul>
      </div>
    </section>

    <section>
      <AppTable
        :columns="columnasCxc"
        :rows="cuentasPorCobrar"
        :loading="clientesQuery.isLoading.value"
        :show-actions="false"
        row-key="idCuenta"
        empty-text="No hay cuentas por cobrar pendientes."
      >
        <template #toolbar>
          <h3 class="text-base font-semibold text-gray-800 dark:text-white/90">
            Control de cuentas por cobrar pendientes
          </h3>
        </template>

        <template #cell-estadoPago="{ value }">
          <AppBadge :color="value === 'VENCIDO' ? 'error' : 'success'" variant="light" size="sm">
            {{ value === 'VENCIDO' ? 'Vencido' : 'Corriente' }}
          </AppBadge>
        </template>

        <template #cell-montoSaldo="{ value }">
          <span class="font-semibold text-gray-800 dark:text-white/90">
            {{ formatCurrency(value as number) }}
          </span>
        </template>
      </AppTable>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import AppIcon from '@/shared/components/AppIcon.vue'
import { AppBadge, AppSummaryCards, AppTable } from '@/shared/components'
import type { SummaryCardItem } from '@/shared/components/ui/AppSummaryCards.vue'
import type { TableColumn } from '@/shared/interfaces/table.interface'
import { ICONS } from '@/shared/constants/icons'
import { PermisoBanderas } from '@/shared/constants/permissions'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { formatCurrency } from '@/shared/utils/currency'
import { displayDDMMYYYY } from '@/shared/utils/dateRange'
import FiltrosActivosBadge from '@/modules/dashboard/components/FiltrosActivosBadge.vue'
import DashboardTopClientesDeudaCard from '@/modules/dashboard/components/DashboardTopClientesDeudaCard.vue'
import { useDashboardFiltros } from '@/modules/dashboard/composables/useDashboardFiltros'
import { useDashboardClientesQuery } from '@/modules/dashboard/composables/useDashboardClientesQuery'
import { useDashboardDeudaQuery } from '@/modules/dashboard/composables/useDashboardDeudaQuery'
import { useDashboardClientesMoraQuery } from '@/modules/dashboard/composables/useDashboardClientesMoraQuery'
import { useDashboardCreditosOtorgadosQuery } from '@/modules/dashboard/composables/useDashboardCreditosOtorgadosQuery'
import { useDashboardTopClientesVentaQuery } from '@/modules/dashboard/composables/useDashboardTopClientesVentaQuery'
import {
  clienteIdDesdeTexto,
  rangoDesdeFiltros,
} from '@/modules/dashboard/utils/dashboard-filtros'

const authStore = useAuthStore()
const { filtros } = useDashboardFiltros()

const canVerClientes = computed(() =>
  authStore.hasPermission(PermisoBanderas.DASHBOARD_VER_CLIENTES),
)
const canVerDeudaCobrar = computed(() =>
  authStore.hasPermission(PermisoBanderas.FINANZAS_CXC_VER),
)

const tieneAccesos = computed(() => canVerClientes.value || canVerDeudaCobrar.value)

const clientesParams = computed(() => {
  const { fechaDesde, fechaHasta } = rangoDesdeFiltros(filtros)
  const idCliente = clienteIdDesdeTexto(filtros.busquedaCliente)
  return {
    ...(fechaDesde ? { fechaDesde } : {}),
    ...(fechaHasta ? { fechaHasta } : {}),
    ...(idCliente != null ? { idCliente } : {}),
  }
})

const rangoFechasParams = computed(() => rangoDesdeFiltros(filtros))

const clientesQuery = useDashboardClientesQuery(clientesParams)
const deudaCobrarQuery = useDashboardDeudaQuery('COBRAR', clientesParams, canVerDeudaCobrar)
const clientesMoraQuery = useDashboardClientesMoraQuery(
  computed(() => ({ ...rangoFechasParams.value, diasUrgente: 30 })),
)
const creditosOtorgadosQuery = useDashboardCreditosOtorgadosQuery(rangoFechasParams)
const topClientesVentaQuery = useDashboardTopClientesVentaQuery(
  computed(() => ({ ...rangoFechasParams.value, limite: 10 })),
)

const clientesConDeuda = computed(
  () => clientesQuery.data.value?.clientesConDeuda.detalle ?? [],
)

const topClientesVenta = computed(() => topClientesVentaQuery.data.value?.detalle ?? [])

const montoVentaMaximo = computed(() =>
  topClientesVenta.value.reduce((max, c) => Math.max(max, c.totalVenta), 0),
)

const porcentajeVenta = (monto: number) => {
  if (montoVentaMaximo.value <= 0) return 0
  return Math.max(4, Math.round((monto / montoVentaMaximo.value) * 100))
}

const resumenCards = computed<SummaryCardItem[]>(() => {
  const cards: SummaryCardItem[] = []

  if (canVerClientes.value) {
    cards.push({
      key: 'clientesActivos',
      label: 'Clientes activos',
      value: clientesQuery.isLoading.value
        ? '—'
        : formatearEntero(clientesQuery.data.value?.totalClientes ?? 0),
      icon: ICONS.users,
    })

    const mora = clientesMoraQuery.data.value
    cards.push({
      key: 'deudoresMora',
      label: 'Deudores en mora',
      value: clientesMoraQuery.isLoading.value ? '—' : formatearEntero(mora?.cantidadDeudoresMora ?? 0),
      hint:
        !clientesMoraQuery.isLoading.value && (mora?.cantidadUrgentes ?? 0) > 0
          ? `${mora?.cantidadUrgentes} casos urgentes (>${mora?.diasUrgente ?? 30} días)`
          : undefined,
      icon: ICONS.alertTriangle,
      iconClass: 'bg-error-500/10 text-error-600 dark:bg-error-500/15 dark:text-error-500',
    })
  }

  if (canVerDeudaCobrar.value) {
    cards.push({
      key: 'deudaTotal',
      label: 'Deuda total',
      value: deudaCobrarQuery.isLoading.value
        ? '—'
        : formatCurrency(deudaCobrarQuery.data.value?.totalPendiente ?? 0),
      hint: 'Pendiente de pago',
      icon: ICONS.handCoins,
    })

    cards.push({
      key: 'creditosOtorgados',
      label: 'Créditos otorgados',
      value: creditosOtorgadosQuery.isLoading.value
        ? '—'
        : formatCurrency(creditosOtorgadosQuery.data.value ?? 0),
      icon: ICONS.creditCard,
    })
  }

  return cards
})

function formatearEntero(value: number): string {
  return new Intl.NumberFormat('es-PE').format(value)
}

interface CuentaPorCobrarRow {
  idCuenta: number
  cliente: string
  comprobante: string
  fechaEmision: string
  diasRetraso: number
  estadoPago: 'VENCIDO' | 'CORRIENTE'
  montoSaldo: number
}

const cuentasPorCobrar = computed<CuentaPorCobrarRow[]>(() => {
  const rows: CuentaPorCobrarRow[] = []
  for (const cliente of clientesConDeuda.value) {
    const nombreCliente = cliente.razonSocial || cliente.nombres || 'Cliente sin nombre'
    for (const comprobante of cliente.comprobantes) {
      rows.push({
        idCuenta: comprobante.idCuenta,
        cliente: nombreCliente,
        comprobante:
          comprobante.serie && comprobante.numero
            ? `${comprobante.serie}-${comprobante.numero}`
            : '—',
        fechaEmision: comprobante.fechaEmision,
        diasRetraso: comprobante.diasRetraso,
        estadoPago: comprobante.estadoPago,
        montoSaldo: comprobante.montoSaldo,
      })
    }
  }
  return rows.sort((a, b) => b.diasRetraso - a.diasRetraso)
})

const columnasCxc: TableColumn<CuentaPorCobrarRow>[] = [
  { key: 'cliente', label: 'Cliente' },
  { key: 'comprobante', label: 'N° comprobante' },
  {
    key: 'fechaEmision',
    label: 'Fecha emisión',
    formatter: (value) => displayDDMMYYYY(String(value)),
  },
  { key: 'diasRetraso', label: 'Días de retraso', align: 'center' },
  { key: 'estadoPago', label: 'Estado', align: 'center' },
  { key: 'montoSaldo', label: 'Monto', align: 'right' },
]
</script>
