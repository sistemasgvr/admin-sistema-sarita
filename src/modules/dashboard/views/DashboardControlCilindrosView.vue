<template>
  <div v-if="!canVerBalones" class="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center dark:border-gray-700 dark:bg-white/[0.03]">
    <div class="flex h-14 w-14 items-center justify-center rounded-full bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
      <AppIcon :name="ICONS.cylinder" :size="28" />
    </div>
    <div class="max-w-md space-y-1">
      <h3 class="text-lg font-semibold text-gray-800 dark:text-white/90">Control de cilindros</h3>
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

    <section class="mb-6 grid gap-4 xl:grid-cols-3">
      <div class="rounded-2xl border border-gray-200 bg-white p-5 xl:col-span-2 dark:border-gray-800 dark:bg-white/[0.03]">
        <h3 class="mb-4 text-base font-semibold text-gray-800 dark:text-white/90">
          Próximas pruebas hidrostáticas (P.H.)
        </h3>

        <div v-if="balonesQuery.isLoading.value" class="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
          Cargando…
        </div>
        <div
          v-else-if="!phPorVencer.length"
          class="py-8 text-center text-sm text-gray-500 dark:text-gray-400"
        >
          No hay balones con P.H. próxima a vencer.
        </div>
        <ul v-else class="divide-y divide-gray-100 dark:divide-gray-800">
          <li
            v-for="balon in phPorVencer"
            :key="balon.idBalon"
            class="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
          >
            <div class="min-w-0">
              <p class="truncate text-theme-sm font-medium text-gray-700 dark:text-gray-200">
                {{ balon.codigoBalon }}
                <span v-if="balon.tipoBalon" class="font-normal text-gray-400 dark:text-gray-500">
                  · {{ balon.tipoBalon }}
                </span>
              </p>
              <p class="text-theme-xs text-gray-400 dark:text-gray-500">
                {{ displayDDMMYYYY(balon.fechaProximaPh) }}
              </p>
            </div>
            <AppBadge :color="colorUrgenciaPh(balon)" variant="light" size="sm" class="shrink-0">
              {{ etiquetaUrgenciaPh(balon) }}
            </AppBadge>
          </li>
        </ul>
      </div>

      <div class="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
        <h3 class="mb-4 text-base font-semibold text-gray-800 dark:text-white/90">
          Control de garantías por alquiler
        </h3>

        <div v-if="garantiasQuery.isLoading.value" class="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
          Cargando…
        </div>
        <div v-else class="space-y-4">
          <div>
            <p class="text-theme-xs text-gray-500 dark:text-gray-400">Total de garantías en caja</p>
            <p class="text-xl font-semibold text-gray-800 dark:text-white/90">
              {{ formatCurrency(garantiasQuery.data.value?.totalEnCaja ?? 0) }}
            </p>
          </div>

          <div>
            <div class="mb-1 flex items-center justify-between text-theme-xs text-gray-500 dark:text-gray-400">
              <span>Contratos activos ({{ garantiasQuery.data.value?.contratosActivos ?? 0 }})</span>
              <span class="font-medium text-gray-700 dark:text-gray-200">
                {{ garantiasQuery.data.value?.porcentajeBalonesEnCampo ?? 0 }}% de balones en campo
              </span>
            </div>
            <div class="h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-white/10">
              <div
                class="h-full rounded-full bg-brand-500 dark:bg-brand-400"
                :style="{ width: `${garantiasQuery.data.value?.porcentajeBalonesEnCampo ?? 0}%` }"
              />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3 pt-2">
            <div class="rounded-xl border border-gray-100 px-3 py-2.5 dark:border-gray-800">
              <p class="text-theme-xs text-gray-500 dark:text-gray-400">Por devolver a clientes</p>
              <p class="text-theme-sm font-semibold text-gray-800 dark:text-white/90">
                {{ formatCurrency(garantiasQuery.data.value?.porDevolverClientes ?? 0) }}
              </p>
            </div>
            <div class="rounded-xl border border-gray-100 px-3 py-2.5 dark:border-gray-800">
              <p class="text-theme-xs text-gray-500 dark:text-gray-400">Ingresado este mes</p>
              <p class="text-theme-sm font-semibold text-gray-800 dark:text-white/90">
                {{ formatCurrency(garantiasQuery.data.value?.ingresadoEsteMes ?? 0) }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section v-if="bajasSolicitadas.length">
      <AppTable
        :columns="columnasBajas"
        :rows="bajasSolicitadas"
        :loading="bajasQuery.isLoading.value"
        :show-actions="false"
        row-key="idBaja"
        empty-text="No hay solicitudes de baja pendientes."
      >
        <template #toolbar>
          <h3 class="text-base font-semibold text-gray-800 dark:text-white/90">
            Solicitudes de baja pendientes
          </h3>
        </template>

        <template #cell-fechaBaja="{ value }">
          {{ displayDDMMYYYY(value as string) }}
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
import type { BadgeColor } from '@/shared/interfaces/badge.interface'
import { ICONS } from '@/shared/constants/icons'
import { PermisoBanderas } from '@/shared/constants/permissions'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { formatCurrency, formatNumber } from '@/shared/utils/currency'
import { displayDDMMYYYY } from '@/shared/utils/dateRange'
import FiltrosActivosBadge from '@/modules/dashboard/components/FiltrosActivosBadge.vue'
import { useDashboardBalonesQuery } from '@/modules/dashboard/composables/useDashboardBalonesQuery'
import { useDashboardBalonesBajasQuery } from '@/modules/dashboard/composables/useDashboardBalonesBajasQuery'
import { useDashboardGarantiasAlquilerQuery } from '@/modules/dashboard/composables/useDashboardGarantiasAlquilerQuery'
import type { DashboardBalonPhPorVencer } from '@/modules/dashboard/interfaces/dashboard.interface'

const authStore = useAuthStore()

const canVerBalones = computed(() =>
  authStore.hasPermission(PermisoBanderas.DASHBOARD_VER_BALONES),
)

const balonesQuery = useDashboardBalonesQuery()
const bajasQuery = useDashboardBalonesBajasQuery()
const garantiasQuery = useDashboardGarantiasAlquilerQuery()

const resumenCards = computed<SummaryCardItem[]>(() => {
  const data = balonesQuery.data.value
  const loading = balonesQuery.isLoading.value

  return [
    {
      key: 'enPrestamo',
      label: 'Cilindros en préstamo',
      value: loading ? '—' : formatNumber(data?.envasesEnCampo.cantidad ?? 0),
      icon: ICONS.truck,
    },
    {
      key: 'enAlmacen',
      label: 'Envases en almacén',
      value: loading ? '—' : formatNumber(data?.enAlmacen.cantidad ?? 0),
      icon: ICONS.warehouse,
    },
    {
      key: 'mantenimiento',
      label: 'Cilindros en taller/mantenimiento',
      value: loading ? '—' : formatNumber(data?.mantenimiento.cantidad ?? 0),
      icon: ICONS.wrench,
    },
    {
      key: 'bajasSolicitadas',
      label: 'Bajas solicitadas',
      value: bajasQuery.isLoading.value ? '—' : formatNumber(bajasQuery.data.value?.cantidad ?? 0),
      icon: ICONS.trash,
      iconClass: 'bg-error-500/10 text-error-600 dark:bg-error-500/15 dark:text-error-500',
    },
  ]
})

const phPorVencer = computed(() => balonesQuery.data.value?.phPorVencer.detalle ?? [])

const colorUrgenciaPh = (balon: DashboardBalonPhPorVencer): BadgeColor => {
  if (balon.vencido) return 'error'
  if (balon.diasRestantes <= 30) return 'error'
  if (balon.diasRestantes <= 60) return 'warning'
  if (balon.diasRestantes <= 90) return 'primary'
  return 'success'
}

const etiquetaUrgenciaPh = (balon: DashboardBalonPhPorVencer): string => {
  if (balon.vencido) return 'Vencido'
  if (balon.diasRestantes <= 30) return `Crítico · ${balon.diasRestantes} días`
  if (balon.diasRestantes <= 60) return `Preventivo · ${balon.diasRestantes} días`
  if (balon.diasRestantes <= 90) return `En plazo · ${balon.diasRestantes} días`
  return 'Seguro'
}

const bajasSolicitadas = computed(() => bajasQuery.data.value?.detalle ?? [])

const columnasBajas: TableColumn<(typeof bajasSolicitadas.value)[number]>[] = [
  { key: 'codigoBalon', label: 'Balón' },
  { key: 'motivo', label: 'Motivo' },
  { key: 'fechaBaja', label: 'Fecha' },
  { key: 'usuarioSolicita', label: 'Solicitado por' },
]
</script>
