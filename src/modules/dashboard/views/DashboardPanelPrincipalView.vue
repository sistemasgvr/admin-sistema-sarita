<template>
  <div>
    <section v-if="hayCardsEconomico" class="mb-6">
      <div class="grid grid-cols-[repeat(auto-fit,minmax(230px,1fr))] gap-3">
        <AppInspectPopover
          v-for="card in resumenEconomicoCards"
          :key="card.key"
          :title="card.label"
        >
          <component
            :is="card.to ? RouterLink : 'div'"
            :to="card.to"
            class="flex h-full w-full flex-col rounded-xl border border-gray-200 bg-white px-4 py-4 transition hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-md dark:border-gray-800 dark:bg-gray-900 dark:hover:border-brand-500/40"
          >
            <div class="flex items-start justify-between gap-2">
              <p class="text-theme-xs text-gray-500 dark:text-gray-400">{{ card.label }}</p>
              <span
                class="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-100 text-brand-600 dark:bg-brand-500/20 dark:text-brand-300"
              >
                <AppIcon :name="card.icon ?? ICONS.dashboard" :size="16" />
              </span>
            </div>
            <p class="mt-2 text-xl font-semibold text-gray-800 dark:text-white/90">
              {{ card.value }}
            </p>

            <p
              class="mt-auto flex items-center gap-1 pt-1.5 text-[11px] text-gray-400 dark:text-gray-500"
            >
              <AppIcon :name="ICONS.circleHelp" :size="11" />
              {{ card.to ? card.tooltip ?? 'Clic para ver más' : 'Pasa el cursor para ver el detalle' }}
            </p>
          </component>

          <template #detail>
            <dl class="space-y-2.5">
              <div
                v-for="linea in detallesPorCard(card)"
                :key="linea.label"
                class="flex items-center justify-between gap-3"
              >
                <dt class="text-xs text-gray-500 dark:text-gray-400">{{ linea.label }}</dt>
                <dd class="text-sm font-semibold text-gray-800 dark:text-white/90">
                  {{ linea.value }}
                </dd>
              </div>
            </dl>
          </template>
        </AppInspectPopover>
      </div>
    </section>

    <section v-if="hayGaugesEficiencia" class="mb-6">
      <div class="mb-3 flex items-center gap-2">
        <h3 class="text-base font-semibold text-gray-800 dark:text-white/90">
          Eficiencia de deudas
        </h3>
      </div>
      <div class="grid grid-cols-[repeat(auto-fit,minmax(230px,1fr))] gap-3">
        <RouterLink
          v-for="card in gaugeEficienciaCards"
          :key="card.key"
          :to="card.to"
          :title="card.tooltip"
          class="block rounded-xl border border-gray-200 bg-white px-4 py-3 transition hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-md dark:border-gray-800 dark:bg-gray-900 dark:hover:border-brand-500/40"
        >
          <div class="flex items-center justify-between gap-2">
            <p class="text-theme-xs text-gray-500 dark:text-gray-400">{{ card.label }}</p>
            <span
              class="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-100 text-brand-600 dark:bg-brand-500/20 dark:text-brand-300"
            >
              <AppIcon :name="card.icon" :size="15" />
            </span>
          </div>
          <ApexChart
            type="radialBar"
            :series="[card.porcentaje]"
            :options="card.options"
            :height="150"
          />
          <p class="text-center text-[11px] text-gray-400 dark:text-gray-500">
            {{ card.formulaText }}
          </p>
        </RouterLink>
      </div>
    </section>

    <section v-if="canVerBalones" class="mb-6">
      <div class="mb-3 flex items-center gap-2">
        <h3 class="text-base font-semibold text-gray-800 dark:text-white/90">
          Balance de envases en campo
        </h3>
      </div>
      <AppSummaryCards :cards="envasesCards" :columns="3" />
    </section>

    <section v-if="accionesRapidas.length" class="mb-6">
      <div class="mb-3 flex items-center gap-2">
        <h3 class="text-base font-semibold text-gray-800 dark:text-white/90">Acciones rápidas</h3>
      </div>
      <div class="grid grid-cols-[repeat(auto-fit,minmax(230px,1fr))] gap-3">
        <RouterLink
          v-for="accion in accionesRapidas"
          :key="accion.key"
          :to="accion.to"
          class="group flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 text-left transition hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-md dark:border-gray-800 dark:bg-gray-900 dark:hover:border-brand-500/40"
        >
          <span
            class="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-100 text-brand-600 dark:bg-brand-500/20 dark:text-brand-300"
          >
            <AppIcon :name="accion.icon" :size="20" />
          </span>
          <span class="flex min-w-0 flex-col">
            <span
              class="text-sm font-semibold text-gray-800 group-hover:text-brand-600 dark:text-white/90 dark:group-hover:text-brand-400"
            >
              {{ accion.label }}
            </span>
            <span class="truncate text-theme-xs text-gray-500 dark:text-gray-400">
              {{ accion.hint }}
            </span>
          </span>
        </RouterLink>
      </div>
    </section>

    <section
      v-if="canVerVentas && (canVerCompras || demandaGasesDetalle.length)"
      class="mb-6 grid gap-4 xl:grid-cols-3"
    >
      <div
        v-if="canVerCompras"
        class="rounded-2xl border border-gray-200 bg-white p-5 xl:col-span-2 dark:border-gray-800 dark:bg-white/[0.03]"
      >
        <div class="mb-3 flex items-center justify-between gap-2">
          <h3 class="text-base font-semibold text-gray-800 dark:text-white/90">
            Comparativo histórico: ventas vs compras
          </h3>
          <span class="hidden text-[11px] text-gray-400 dark:text-gray-500 sm:inline">
            Clic en una barra para ir al listado
          </span>
        </div>
        <ApexChart type="bar" :series="historicoSeries" :options="historicoOptions" :height="320" />
      </div>

      <div
        class="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]"
        :class="{ 'xl:col-span-3': !canVerCompras }"
      >
        <div class="mb-1 flex items-center justify-between gap-2">
          <h3 class="text-base font-semibold text-gray-800 dark:text-white/90">
            Demanda de gases
          </h3>
          <span
            v-if="demandaGasesDetalle.length"
            class="hidden text-[11px] text-gray-400 dark:text-gray-500 sm:inline"
          >
            Clic en una barra para ir al producto
          </span>
        </div>
        <p class="mb-3 text-theme-xs text-gray-400 dark:text-gray-500">
          % de unidades vendidas por tipo de gas en el periodo
        </p>
        <div v-if="demandaGasesQuery.isLoading.value" class="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
          Cargando…
        </div>
        <div
          v-else-if="demandaGasesQuery.isError.value"
          class="py-8 text-center text-sm text-error-500"
        >
          No se pudo cargar la demanda de gases.
        </div>
        <div
          v-else-if="!demandaGasesDetalle.length"
          class="py-8 text-center text-sm text-gray-500 dark:text-gray-400"
        >
          Sin ventas de gases en el periodo.
        </div>
        <ApexChart
          v-else
          type="bar"
          :series="demandaGasesSeries"
          :options="demandaGasesOptions"
          :height="Math.max(180, demandaGasesDetalle.length * 46)"
        />
      </div>
    </section>

    <section v-if="canVerClientes || canVerProductos" class="mb-6 grid gap-4 lg:grid-cols-2">
      <DashboardTopClientesDeudaCard
        v-if="canVerClientes"
        :class="{ 'lg:col-span-2': !canVerProductos }"
        :clientes="topClientesDeuda"
        :loading="clientesQuery.isLoading.value"
        :limite="5"
      />
      <DashboardStockCriticoCard
        v-if="canVerProductos"
        :class="{ 'lg:col-span-2': !canVerClientes }"
        :registros="stockCriticoQuery.data.value?.registros ?? []"
        :loading="stockCriticoQuery.isLoading.value"
      />
    </section>

    <div
      v-if="!hayCardsEconomico"
      class="rounded-2xl border border-gray-200 bg-white px-5 py-8 dark:border-gray-800 dark:bg-white/3 xl:px-10"
    >
      <h3 class="mb-2 text-lg font-semibold text-gray-800 dark:text-white/90">
        Bienvenido al panel de administración
      </h3>
      <p class="text-sm text-gray-500 dark:text-gray-400">
        Desde aquí podrás gestionar clientes y más módulos del sistema Oxígeno Sarita.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRouter, type RouteLocationRaw } from 'vue-router'
import type { ApexOptions } from 'apexcharts'
import { ApexChart, AppInspectPopover, AppSummaryCards } from '@/shared/components'
import AppIcon from '@/shared/components/AppIcon.vue'
import type { SummaryCardItem } from '@/shared/components/ui/AppSummaryCards.vue'
import { PermisoBanderas } from '@/shared/constants/permissions'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { useDashboardVentasNetasQuery } from '@/modules/dashboard/composables/useDashboardVentasNetasQuery'
import { useDashboardComprasNetasQuery } from '@/modules/dashboard/composables/useDashboardComprasNetasQuery'
import { useDashboardDeudaQuery } from '@/modules/dashboard/composables/useDashboardDeudaQuery'
import { useDashboardRentabilidadQuery } from '@/modules/dashboard/composables/useDashboardRentabilidadQuery'
import { useDashboardHistoricoQuery } from '@/modules/dashboard/composables/useDashboardHistoricoQuery'
import { useDashboardDemandaGasesQuery } from '@/modules/dashboard/composables/useDashboardDemandaGasesQuery'
import { useDashboardBalonesQuery } from '@/modules/dashboard/composables/useDashboardBalonesQuery'
import { useDashboardClientesQuery } from '@/modules/dashboard/composables/useDashboardClientesQuery'
import { useDashboardStockCriticoQuery } from '@/modules/dashboard/composables/useDashboardStockCriticoQuery'
import { useDashboardFiltros } from '@/modules/dashboard/composables/useDashboardFiltros'
import {
  clienteIdDesdeTexto,
  rangoDesdeFiltros,
} from '@/modules/dashboard/utils/dashboard-filtros'
import { ICONS } from '@/shared/constants/icons'
import { formatCurrency, formatNumber } from '@/shared/utils/currency'
import DashboardTopClientesDeudaCard from '@/modules/dashboard/components/DashboardTopClientesDeudaCard.vue'
import DashboardStockCriticoCard from '@/modules/dashboard/components/DashboardStockCriticoCard.vue'

const authStore = useAuthStore()
const router = useRouter()
const { filtros } = useDashboardFiltros()

const canVerVentas = computed(() =>
  authStore.hasPermission(PermisoBanderas.DASHBOARD_VER_VENTAS),
)
const canVerCompras = computed(() =>
  authStore.hasPermission(PermisoBanderas.DASHBOARD_VER_COMPRAS),
)
const canVerDeudaPagar = computed(() =>
  authStore.hasPermission(PermisoBanderas.FINANZAS_CXP_VER),
)
const canVerDeudaCobrar = computed(() =>
  authStore.hasPermission(PermisoBanderas.FINANZAS_CXC_VER),
)
const canVerBalones = computed(() =>
  authStore.hasPermission(PermisoBanderas.DASHBOARD_VER_BALONES),
)
const canVerClientes = computed(() =>
  authStore.hasPermission(PermisoBanderas.DASHBOARD_VER_CLIENTES),
)
const canVerProductos = computed(() =>
  authStore.hasPermission(PermisoBanderas.DASHBOARD_VER_PRODUCTOS),
)

const ventasParams = computed(() => {
  const { fechaDesde, fechaHasta } = rangoDesdeFiltros(filtros)
  const idCliente = clienteIdDesdeTexto(filtros.busquedaCliente)
  return {
    ...(fechaDesde ? { fechaDesde } : {}),
    ...(fechaHasta ? { fechaHasta } : {}),
    ...(idCliente != null ? { idCliente } : {}),
  }
})

const comprasParams = computed(() => {
  const { fechaDesde, fechaHasta } = rangoDesdeFiltros(filtros)
  return {
    ...(fechaDesde ? { fechaDesde } : {}),
    ...(fechaHasta ? { fechaHasta } : {}),
  }
})

const deudaParams = computed(() => {
  const { fechaDesde, fechaHasta } = rangoDesdeFiltros(filtros)
  const idCliente = clienteIdDesdeTexto(filtros.busquedaCliente)
  return {
    ...(fechaDesde ? { fechaDesde } : {}),
    ...(fechaHasta ? { fechaHasta } : {}),
    ...(idCliente != null ? { idCliente } : {}),
  }
})

const rangoFechasParams = computed(() => rangoDesdeFiltros(filtros))

const ventasQuery = useDashboardVentasNetasQuery(ventasParams)
const comprasQuery = useDashboardComprasNetasQuery(comprasParams)
const deudaPagarQuery = useDashboardDeudaQuery('PAGAR', deudaParams, canVerDeudaPagar)
const deudaCobrarQuery = useDashboardDeudaQuery('COBRAR', deudaParams, canVerDeudaCobrar)
const rentabilidadQuery = useDashboardRentabilidadQuery(rangoFechasParams)
const historicoQuery = useDashboardHistoricoQuery()
const demandaGasesQuery = useDashboardDemandaGasesQuery(rangoFechasParams)
const balonesQuery = useDashboardBalonesQuery()
const clientesQuery = useDashboardClientesQuery(deudaParams)
const stockCriticoQuery = useDashboardStockCriticoQuery({ limite: 5 })

const resumenEconomicoCards = computed<SummaryCardItem[]>(() => {
  const cards: SummaryCardItem[] = []

  if (canVerVentas.value) {
    cards.push({
      key: 'ventasNetas',
      label: 'Ventas netas',
      value: ventasQuery.isLoading.value
        ? '—'
        : formatCurrency(ventasQuery.data.value?.totalVentasNetas ?? 0),
      icon: ICONS.trendingUp,
      to: { name: 'admin-ventas-comprobantes' },
      tooltip: 'Ir al listado de ventas',
    })
  }

  if (canVerCompras.value) {
    cards.push({
      key: 'comprasNetas',
      label: 'Compras netas',
      value: comprasQuery.isLoading.value
        ? '—'
        : formatCurrency(comprasQuery.data.value?.totalComprasNetas ?? 0),
      icon: ICONS.shoppingCart,
      to: { name: 'admin-compras' },
      tooltip: 'Ir al listado de compras',
    })
  }

  if (canVerDeudaPagar.value) {
    cards.push({
      key: 'deudaPagar',
      label: 'Deuda total (por pagar)',
      value: deudaPagarQuery.isLoading.value
        ? '—'
        : formatCurrency(deudaPagarQuery.data.value?.totalPendiente ?? 0),
      hint: 'Cuentas por pagar pendientes',
      icon: 'lucide:wallet',
      to: { name: 'admin-finanzas-pagar' },
      tooltip: 'Ir a Cuentas por pagar',
    })
  }

  if (canVerDeudaCobrar.value) {
    cards.push({
      key: 'deudaCobrar',
      label: 'Deuda por cobrar',
      value: deudaCobrarQuery.isLoading.value
        ? '—'
        : formatCurrency(deudaCobrarQuery.data.value?.totalPendiente ?? 0),
      hint: 'Cuentas por cobrar pendientes',
      icon: ICONS.handCoins,
      to: { name: 'admin-finanzas' },
      tooltip: 'Ir a Cuentas por cobrar',
    })
  }

  if (canVerVentas.value) {
    cards.push({
      key: 'rentabilidad',
      label: 'Rentabilidad',
      value: rentabilidadQuery.isLoading.value
        ? '—'
        : formatCurrency(rentabilidadQuery.data.value?.rentabilidad ?? 0),
      hint: 'Margen neto del periodo',
      icon: ICONS.gauge,
      // Sin "to": es una métrica derivada (ventas - compras), no tiene una vista propia.
    })
  }

  return cards
})

const hayCardsEconomico = computed(() => resumenEconomicoCards.value.length > 0)

interface DetalleLinea {
  label: string
  value: string | number
}

const detallesPorCard = (card: SummaryCardItem): DetalleLinea[] => {
  if (card.key === 'deudaPagar') {
    const data = deudaPagarQuery.data.value
    return [
      { label: 'Documentos pendientes', value: data?.cantidadCuentas ?? 0 },
      { label: 'Total pagado', value: formatCurrency(data?.totalPagado ?? 0) },
      { label: 'Total vencido', value: formatCurrency(data?.totalVencido ?? 0) },
      { label: 'Cuotas vencidas', value: data?.cantidadVencidas ?? 0 },
      { label: 'Proveedores con saldo', value: data?.cantidadTerceros ?? 0 },
    ]
  }

  if (card.key === 'deudaCobrar') {
    const data = deudaCobrarQuery.data.value
    return [
      { label: 'Documentos pendientes', value: data?.cantidadCuentas ?? 0 },
      { label: 'Total cobrado', value: formatCurrency(data?.totalCobrado ?? 0) },
      { label: 'Total vencido', value: formatCurrency(data?.totalVencido ?? 0) },
      { label: 'Cuotas vencidas', value: data?.cantidadVencidas ?? 0 },
      { label: 'Clientes con deuda', value: data?.cantidadTerceros ?? 0 },
    ]
  }

  if (card.key === 'ventasNetas') {
    const data = ventasQuery.data.value
    return [{ label: 'Ventas netas', value: formatCurrency(data?.totalVentasNetas ?? 0) }]
  }

  if (card.key === 'comprasNetas') {
    const data = comprasQuery.data.value
    return [{ label: 'Compras netas', value: formatCurrency(data?.totalComprasNetas ?? 0) }]
  }

  if (card.key === 'rentabilidad') {
    const data = rentabilidadQuery.data.value
    return [
      { label: 'Ventas netas', value: formatCurrency(data?.ventasNetas ?? 0) },
      { label: 'Compras netas', value: formatCurrency(data?.comprasNetas ?? 0) },
      { label: 'Rentabilidad', value: formatCurrency(data?.rentabilidad ?? 0) },
    ]
  }

  return []
}

interface GaugeEficienciaCard {
  key: string
  label: string
  icon: string
  porcentaje: number
  formulaText: string
  options: ApexOptions
  to: RouteLocationRaw
  tooltip: string
}

const colorEficiencia = (porcentaje: number): string => {
  const t = Math.min(1, Math.max(0, porcentaje / 100))
  const rojo = { r: 239, g: 68, b: 68 }
  const verde = { r: 34, g: 197, b: 94 }
  const r = Math.round(rojo.r + (verde.r - rojo.r) * t)
  const g = Math.round(rojo.g + (verde.g - rojo.g) * t)
  const b = Math.round(rojo.b + (verde.b - rojo.b) * t)
  return `rgb(${r}, ${g}, ${b})`
}

const gaugeOptions = (porcentaje: number): ApexOptions => {
  const color = colorEficiencia(porcentaje)
  return {
    chart: { type: 'radialBar' },
    plotOptions: {
      radialBar: {
        startAngle: -90,
        endAngle: 90,
        hollow: { size: '62%' },
        track: { background: '#e5e7eb' },
        dataLabels: {
          name: {
            show: false,
          },
          value: {
            show: true,
            fontSize: '26px',
            fontWeight: 700,
            color,
            formatter: (val: number) => `${val.toFixed(0)}%`,
          },
        },
      },
    },
    legend: { show: false },
    colors: [color],
  }
}

const gaugeEficienciaCards = computed<GaugeEficienciaCard[]>(() => {
  const cards: GaugeEficienciaCard[] = []

  if (canVerDeudaCobrar.value) {
    const data = deudaCobrarQuery.data.value
    const obtenido = data?.totalCobrado ?? 0
    const total = obtenido + (data?.totalPendiente ?? 0)
    const porcentaje = total > 0 ? Math.round((obtenido / total) * 100) : 0
    cards.push({
      key: 'eficienciaCobrar',
      label: 'Eficiencia de cobranza',
      icon: 'lucide:hand-coins',
      porcentaje,
      formulaText: 'Total cobrado ÷ (Total cobrado + Total pendiente)',
      options: gaugeOptions(porcentaje),
      to: { name: 'admin-finanzas' },
      tooltip: 'Ir a Cuentas por cobrar',
    })
  }

  if (canVerDeudaPagar.value) {
    const data = deudaPagarQuery.data.value
    const obtenido = data?.totalPagado ?? 0
    const total = obtenido + (data?.totalPendiente ?? 0)
    const porcentaje = total > 0 ? Math.round((obtenido / total) * 100) : 0
    cards.push({
      key: 'eficienciaPagar',
      label: 'Nivel de pago',
      icon: 'lucide:wallet',
      porcentaje,
      formulaText: 'Total pagado ÷ (Total pagado + Total pendiente)',
      options: gaugeOptions(porcentaje),
      to: { name: 'admin-finanzas-pagar' },
      tooltip: 'Ir a Cuentas por pagar',
    })
  }

  return cards
})

const hayGaugesEficiencia = computed(() => gaugeEficienciaCards.value.length > 0)

// ---------- Balance de envases en campo ----------

const envasesCards = computed<SummaryCardItem[]>(() => {
  const data = balonesQuery.data.value
  const loading = balonesQuery.isLoading.value
  return [
    {
      key: 'totalEnvases',
      label: 'Total de envases',
      value: loading ? '—' : formatNumber(data?.totalBalones ?? 0),
      icon: ICONS.cylinder,
      to: { name: 'admin-balones-cilindros' },
      tooltip: 'Ver libro de cilindros',
    },
    {
      key: 'enAlmacen',
      label: 'En almacén',
      value: loading ? '—' : formatNumber(data?.enAlmacen.cantidad ?? 0),
      icon: ICONS.warehouse,
      to: { name: 'admin-productos-stock' },
      tooltip: 'Ver stock por almacén',
    },
    {
      key: 'enCampo',
      label: 'En préstamo/alquiler',
      value: loading ? '—' : formatNumber(data?.envasesEnCampo.cantidad ?? 0),
      hint:
        !loading && (data?.envasesEnCampo.retrasoCritico ?? 0) > 0
          ? `${data?.envasesEnCampo.retrasoCritico} en retraso crítico`
          : undefined,
      icon: ICONS.truck,
      to: { name: 'admin-balones-prestamos' },
      tooltip: 'Ver préstamos de envases',
    },
  ]
})

// ---------- Acciones rápidas ----------

interface AccionRapida {
  key: string
  label: string
  hint: string
  icon: string
  to: RouteLocationRaw
}

const accionesRapidas = computed<AccionRapida[]>(() => {
  const acciones: AccionRapida[] = []

  if (canVerVentas.value) {
    acciones.push({
      key: 'ventas',
      label: 'Ventas',
      hint: 'Análisis de ingresos',
      icon: ICONS.shoppingCart,
      to: { name: 'admin-ventas-comprobantes' },
    })
  }

  if (canVerClientes.value) {
    acciones.push({
      key: 'clientes',
      label: 'Clientes',
      hint: 'Morosidad y comportamiento',
      icon: ICONS.users,
      to: { name: 'admin-clientes' },
    })
  }

  if (canVerProductos.value) {
    acciones.push({
      key: 'inventario',
      label: 'Inventario',
      hint: 'Catálogo y rotación',
      icon: ICONS.boxes,
      to: { name: 'admin-productos-articulos' },
    })
  }

  if (canVerBalones.value) {
    acciones.push({
      key: 'balones',
      label: 'Balones',
      hint: 'Trazabilidad y estados',
      icon: ICONS.cylinder,
      to: { name: 'admin-balones' },
    })
  }

  return acciones
})

// ---------- Comparativo histórico: ventas vs compras ----------

const historicoSeries = computed(() => {
  const meses = historicoQuery.data.value?.meses ?? []
  return [
    { name: 'Ventas', data: meses.map((m) => m.ventas) },
    { name: 'Compras', data: meses.map((m) => m.compras) },
  ]
})

// Al hacer clic en una barra, vamos al listado real (Ventas o Compras) del mes
// clickeado — series 0 = Ventas, 1 = Compras (mismo orden que historicoSeries).
const irAMesHistorico = (seriesIndex: number, dataPointIndex: number) => {
  const mes = historicoQuery.data.value?.meses?.[dataPointIndex]
  if (!mes) return
  if (seriesIndex === 0 && canVerVentas.value) {
    void router.push({ name: 'admin-ventas-comprobantes' })
  } else if (seriesIndex === 1 && canVerCompras.value) {
    void router.push({ name: 'admin-compras' })
  }
}

const historicoOptions = computed<ApexOptions>(() => ({
  chart: {
    type: 'bar',
    events: {
      dataPointSelection: (_event, _chartContext, config) => {
        if (!config) return
        irAMesHistorico(config.seriesIndex, config.dataPointIndex)
      },
    },
  },
  xaxis: {
    categories: (historicoQuery.data.value?.meses ?? []).map((m) => m.nombreMes),
  },
  plotOptions: { bar: { columnWidth: '55%', borderRadius: 3 } },
  colors: ['#12b76a', '#36bffa'],
  yaxis: { labels: { formatter: (val: number) => formatNumber(val) } },
  legend: { position: 'top', horizontalAlign: 'right' },
  tooltip: {
    y: { formatter: (val: number) => formatCurrency(val) },
  },
}))

// ---------- Demanda de gases ----------
// Es "parte del todo" con pocas categorías (≤ 8): barras horizontales rankeadas,
// no dona/pie (menos legible para comparar magnitudes y para leer % exactos).

const demandaGasesDetalle = computed(() => demandaGasesQuery.data.value?.detalle ?? [])

const demandaGasesSeries = computed(() => [
  { name: 'Vendido', data: demandaGasesDetalle.value.map((p) => p.cantidad) },
])

const irAProductoDemanda = (dataPointIndex: number) => {
  const producto = demandaGasesDetalle.value[dataPointIndex]
  if (!producto) return
  void router.push({ name: 'admin-productos-articulos-detalle', params: { id: producto.idProducto } })
}

const demandaGasesOptions = computed<ApexOptions>(() => ({
  chart: {
    type: 'bar',
    events: {
      dataPointSelection: (_event, _chartContext, config) => {
        if (!config) return
        irAProductoDemanda(config.dataPointIndex)
      },
    },
  },
  plotOptions: {
    bar: {
      horizontal: true,
      barHeight: '60%',
      borderRadius: 4,
      borderRadiusApplication: 'end',
    },
  },
  colors: ['#14b8a6'],
  xaxis: {
    categories: demandaGasesDetalle.value.map((p) => p.producto),
    labels: { formatter: (val: string) => formatNumber(Number(val)) },
  },
  grid: { yaxis: { lines: { show: false } } },
  dataLabels: {
    enabled: true,
    formatter: (_val: number, opts) => {
      const index = opts?.dataPointIndex ?? -1
      return `${demandaGasesDetalle.value[index]?.porcentaje ?? 0}%`
    },
    style: { fontSize: '11px', fontWeight: 600 },
    offsetX: 4,
  },
  tooltip: {
    y: {
      formatter: (val: number, opts) => {
        const producto = demandaGasesDetalle.value[opts?.dataPointIndex ?? -1]
        return `${formatNumber(val)} unid. (${producto?.porcentaje ?? 0}% del total)`
      },
    },
  },
}))

// ---------- Top clientes con mayor deuda ----------

const topClientesDeuda = computed(() => clientesQuery.data.value?.clientesConDeuda.detalle ?? [])
</script>