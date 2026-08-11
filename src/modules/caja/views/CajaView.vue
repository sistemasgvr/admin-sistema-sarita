<template>
  <div>
    <PageBreadcrumb page-title="Caja" :items="breadcrumbItems" />

    <div class="space-y-4">
      <div
        class="rounded-2xl border border-gray-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-white/[0.03] sm:px-5"
      >
        <div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div class="flex min-w-0 flex-wrap items-center gap-2">
            <h3 class="text-base font-semibold text-gray-800 dark:text-white/90">Caja / arqueo</h3>
            <AppHelpTip
              text="Control operativo del día: abrir, registrar gastos/depósitos y cerrar. No reemplaza el Resumen diario SUNAT."
            />
            <AppBadge
              v-if="sesion?.estadoCaja"
              :color="sesion.estadoCaja === 'ABIERTA' ? 'success' : 'warning'"
            >
              {{ sesion.estadoCaja }}
            </AppBadge>
            <AppBadge v-else-if="!isLoading" color="neutral">SIN APERTURA</AppBadge>
          </div>

          <div class="flex flex-wrap items-end gap-2">
            <AppFormField label="Fecha" class="!w-auto min-w-[150px] shrink-0">
              <AppInput v-model="fecha" type="date" class="w-[160px]" />
            </AppFormField>
            <button
              v-if="canAbrir && !sesion?.id"
              type="button"
              class="shrink-0 rounded-lg bg-brand-500 px-3 py-2.5 text-sm font-medium text-white hover:bg-brand-600"
              @click="showAbrir = true"
            >
              Abrir caja
            </button>
            <button
              v-if="canGasto && sesion?.estadoCaja === 'ABIERTA'"
              type="button"
              class="shrink-0 rounded-lg border border-gray-300 px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300"
              @click="showGasto = true"
            >
              Gasto
            </button>
            <button
              v-if="canDeposito && sesion?.estadoCaja === 'ABIERTA'"
              type="button"
              class="shrink-0 rounded-lg border border-gray-300 px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300"
              @click="showDeposito = true"
            >
              Depósito
            </button>
            <button
              v-if="canCerrar && sesion?.id && sesion.estadoCaja === 'ABIERTA'"
              type="button"
              class="shrink-0 rounded-lg bg-gray-900 px-3 py-2.5 text-sm font-medium text-white hover:bg-gray-800 dark:bg-white/10"
              @click="showCerrar = true"
            >
              Cerrar caja
            </button>
          </div>
        </div>

        <p
          v-if="sesion?.id"
          class="mt-2 text-theme-sm text-gray-500 dark:text-gray-400"
        >
          Inicial {{ formatCurrency(sesion.montoInicial) }}
          <span v-if="sesion.usuarioApertura">
            · {{ sesion.usuarioApertura }}
            <template v-if="sesion.fechaApertura">
              ({{ formatFechaHora(sesion.fechaApertura) }})</template
            >
          </span>
          <span v-if="sesion.estadoCaja === 'CERRADA'">
            · Contado {{ formatCurrency(sesion.montoEfectivoContado ?? 0) }} · Dif.
            {{ formatCurrency(sesion.diferencia ?? 0) }}
          </span>
        </p>
      </div>

      <div v-if="isLoading" class="text-theme-sm text-gray-500">Cargando caja del día...</div>
      <div v-else-if="isError" class="text-theme-sm text-red-600">No se pudo cargar la caja.</div>

      <template v-else>
        <div
          v-if="!sesion?.id"
          class="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 dark:border-amber-500/30 dark:bg-amber-500/10"
        >
          <AppIcon
            :name="ICONS.alertTriangle"
            :size="18"
            class="mt-0.5 shrink-0 text-amber-600 dark:text-amber-300"
          />
          <p class="text-theme-sm text-amber-800 dark:text-amber-300">
            Abre la caja para vender en el POS y registrar gastos o depósitos del día.
          </p>
        </div>

        <div
          v-else-if="sesion.estadoCaja === 'CERRADA'"
          class="rounded-xl border border-warning-200 bg-warning-50 px-3 py-2.5 text-theme-sm text-warning-800 dark:border-warning-500/30 dark:bg-warning-500/10 dark:text-warning-300"
        >
          Caja cerrada: no se registran más ventas ni movimientos para esta fecha.
        </div>

        <AppSummaryCards :cards="resumenCards" :columns="3" />

        <div
          class="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]"
        >
          <div class="mb-3 flex items-center gap-2">
            <h4 class="text-sm font-semibold text-gray-800 dark:text-white/90">
              Dinero que debería haber
            </h4>
            <AppHelpTip
              text="Suma lo que entra a caja (fondo, ventas y cobranzas en efectivo/Yape/Plin) y resta lo que sale (depósitos al banco y gastos menudos)."
            />
          </div>

          <ul class="space-y-1.5 text-theme-sm">
            <li
              v-for="linea in desgloseArqueo"
              :key="linea.key"
              class="flex items-center justify-between gap-3 rounded-lg px-2 py-1.5"
              :class="linea.destacado ? 'bg-brand-50 dark:bg-brand-500/10' : 'hover:bg-gray-50 dark:hover:bg-white/[0.02]'"
            >
              <span
                class="flex items-center gap-2"
                :class="
                  linea.destacado
                    ? 'font-semibold text-gray-800 dark:text-white/90'
                    : 'text-gray-600 dark:text-gray-400'
                "
              >
                <span
                  v-if="linea.signo"
                  class="inline-flex h-5 w-5 items-center justify-center rounded text-xs font-bold"
                  :class="
                    linea.signo === '+'
                      ? 'bg-success-100 text-success-700 dark:bg-success-500/20 dark:text-success-300'
                      : 'bg-error-100 text-error-700 dark:bg-error-500/20 dark:text-error-300'
                  "
                >
                  {{ linea.signo }}
                </span>
                {{ linea.label }}
              </span>
              <span
                class="tabular-nums"
                :class="
                  linea.destacado
                    ? 'text-base font-semibold text-brand-600 dark:text-brand-400'
                    : 'font-medium text-gray-800 dark:text-white/90'
                "
              >
                {{ formatCurrency(linea.monto) }}
              </span>
            </li>
          </ul>
        </div>

        <div v-if="sesion?.id" class="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div
            class="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]"
          >
            <div class="mb-2 flex items-center justify-between">
              <h4 class="text-sm font-semibold text-gray-800 dark:text-white/90">Gastos de caja</h4>
              <span class="text-theme-sm text-gray-500">{{ gastos.length }}</span>
            </div>
            <ul v-if="gastos.length" class="divide-y divide-gray-100 dark:divide-gray-800">
              <li
                v-for="g in gastos"
                :key="g.id"
                class="flex items-start justify-between gap-3 py-2 text-theme-sm"
              >
                <div class="min-w-0">
                  <p class="truncate font-medium text-gray-800 dark:text-white/90">{{ g.concepto }}</p>
                  <p class="text-gray-500 dark:text-gray-400">
                    {{ g.medioPago || '—' }}
                    <span v-if="g.numeroOperacion">· {{ g.numeroOperacion }}</span>
                  </p>
                </div>
                <span class="shrink-0 tabular-nums font-medium text-gray-800 dark:text-white/90">
                  {{ formatCurrency(g.monto) }}
                </span>
              </li>
            </ul>
            <p v-else class="text-theme-sm text-gray-500 dark:text-gray-400">Sin gastos.</p>
          </div>

          <div
            class="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]"
          >
            <div class="mb-2 flex items-center justify-between">
              <h4 class="text-sm font-semibold text-gray-800 dark:text-white/90">Depósitos</h4>
              <span class="text-theme-sm text-gray-500">{{ depositos.length }}</span>
            </div>
            <ul v-if="depositos.length" class="divide-y divide-gray-100 dark:divide-gray-800">
              <li
                v-for="d in depositos"
                :key="d.id"
                class="flex items-start justify-between gap-3 py-2 text-theme-sm"
              >
                <div class="min-w-0">
                  <p class="truncate font-medium text-gray-800 dark:text-white/90">
                    {{ d.cuentaBancaria || 'Depósito a banco' }}
                  </p>
                  <p class="text-gray-500 dark:text-gray-400">
                    {{ d.medioPago || '—' }}
                    <span v-if="d.numeroOperacion">· {{ d.numeroOperacion }}</span>
                  </p>
                </div>
                <span class="shrink-0 tabular-nums font-medium text-gray-800 dark:text-white/90">
                  {{ formatCurrency(d.monto) }}
                </span>
              </li>
            </ul>
            <p v-else class="text-theme-sm text-gray-500 dark:text-gray-400">Sin depósitos.</p>
          </div>
        </div>
      </template>

      <AbrirCajaModal v-model="showAbrir" :fecha="fecha" />
      <CerrarCajaModal
        v-if="sesion?.id"
        v-model="showCerrar"
        :id-sesion="sesion.id"
        :caja-esperada="cajaEsperada"
      />
      <RegistrarGastoCajaModal v-model="showGasto" :fecha="fecha" :id-sesion="sesion?.id" />
      <RegistrarDepositoCajaModal v-model="showDeposito" :fecha="fecha" :id-sesion="sesion?.id" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import PageBreadcrumb from '@/modules/admin/components/PageBreadcrumb.vue'
import { ventasBreadcrumbItems } from '@/modules/ventas/config/ventas-breadcrumb'
import { AppBadge, AppHelpTip, AppInput, AppSummaryCards } from '@/shared/components'
import AppFormField from '@/shared/components/form/AppFormField.vue'
import AppIcon from '@/shared/components/AppIcon.vue'
import type { SummaryCardItem } from '@/shared/components/ui/AppSummaryCards.vue'
import AbrirCajaModal from '@/modules/caja/components/AbrirCajaModal.vue'
import CerrarCajaModal from '@/modules/caja/components/CerrarCajaModal.vue'
import RegistrarGastoCajaModal from '@/modules/caja/components/RegistrarGastoCajaModal.vue'
import RegistrarDepositoCajaModal from '@/modules/caja/components/RegistrarDepositoCajaModal.vue'
import { useCajaDiaQuery } from '@/modules/caja/composables/useCajaQuery'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { ICONS } from '@/shared/constants/icons'
import { PermisoBanderas } from '@/shared/constants/permissions'
import { formatCurrency } from '@/shared/utils/currency'

const breadcrumbItems = ventasBreadcrumbItems('Caja')

function hoyLocal(): string {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

function formatFechaHora(value: string): string {
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleString('es-PE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const auth = useAuthStore()
const fecha = ref(hoyLocal())
const idSucursal = ref<number | null>(null)
const showAbrir = ref(false)
const showCerrar = ref(false)
const showGasto = ref(false)
const showDeposito = ref(false)

const query = useCajaDiaQuery(fecha, idSucursal)
const sesion = computed(() => query.data.value)
const isLoading = computed(() => query.isLoading.value)
const isError = computed(() => query.isError.value)

const totales = computed(() => sesion.value?.totales)
const gastos = computed(() => sesion.value?.gastos ?? [])
const depositos = computed(() => sesion.value?.depositos ?? [])

const montoInicial = computed(() => Number(sesion.value?.montoInicial ?? 0))
const ventasMediosCaja = computed(() => Number(totales.value?.ventasMediosCaja ?? 0))
const cobranzasMediosCaja = computed(() => Number(totales.value?.cobranzasMediosCaja ?? 0))
const totalDepositos = computed(() => Number(totales.value?.depositos ?? 0))
const totalGastosCaja = computed(() => Number(totales.value?.gastosCaja ?? 0))

const cajaEsperada = computed(
  () =>
    sesion.value?.cajaEsperada ??
    montoInicial.value +
      ventasMediosCaja.value +
      cobranzasMediosCaja.value -
      totalDepositos.value -
      totalGastosCaja.value,
)

const canAbrir = computed(() => auth.hasPermission(PermisoBanderas.CAJA_ABRIR))
const canCerrar = computed(() => auth.hasPermission(PermisoBanderas.CAJA_CERRAR))
const canGasto = computed(() => auth.hasPermission(PermisoBanderas.CAJA_REGISTRAR_GASTO))
const canDeposito = computed(() => auth.hasPermission(PermisoBanderas.CAJA_REGISTRAR_DEPOSITO))

const resumenCards = computed<SummaryCardItem[]>(() => [
  {
    key: 'contado',
    label: 'Ventas contado',
    value: formatCurrency(totales.value?.ventasContado ?? 0),
    icon: ICONS.banknote,
    iconClass: 'bg-success-100 text-success-700 dark:bg-success-500/20 dark:text-success-300',
  },
  {
    key: 'credito',
    label: 'Ventas crédito',
    value: formatCurrency(totales.value?.ventasCredito ?? 0),
    icon: ICONS.creditCard,
    iconClass: 'bg-brand-100 text-brand-600 dark:bg-brand-500/20 dark:text-brand-300',
  },
  {
    key: 'cobranzas',
    label: 'Cobranzas',
    value: formatCurrency(totales.value?.cobranzas ?? 0),
    icon: ICONS.wallet,
    iconClass: 'bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300',
  },
  {
    key: 'gastos',
    label: 'Gastos caja',
    value: formatCurrency(totales.value?.gastosCaja ?? 0),
    icon: ICONS.arrowUpFromLine,
    iconClass: 'bg-error-100 text-error-700 dark:bg-error-500/20 dark:text-error-300',
  },
  {
    key: 'depositos',
    label: 'Depósitos',
    value: formatCurrency(totales.value?.depositos ?? 0),
    icon: ICONS.arrowDownToLine,
    iconClass: 'bg-warning-100 text-warning-700 dark:bg-warning-500/20 dark:text-warning-300',
  },
  {
    key: 'esperada',
    label: 'Caja esperada',
    value: formatCurrency(cajaEsperada.value),
    icon: ICONS.cashRegister,
    iconClass: 'bg-brand-100 text-brand-600 dark:bg-brand-500/20 dark:text-brand-300',
    hint: 'Lo que debería haber al cerrar',
  },
])

const desgloseArqueo = computed(() => [
  {
    key: 'inicial',
    label: 'Fondo al abrir',
    signo: '+' as const,
    monto: montoInicial.value,
    destacado: false,
  },
  {
    key: 'ventas',
    label: 'Ventas en efectivo / Yape / Plin',
    signo: '+' as const,
    monto: ventasMediosCaja.value,
    destacado: false,
  },
  {
    key: 'cobranzas',
    label: 'Cobranzas en efectivo / Yape / Plin',
    signo: '+' as const,
    monto: cobranzasMediosCaja.value,
    destacado: false,
  },
  {
    key: 'depositos',
    label: 'Depósitos al banco',
    signo: '-' as const,
    monto: totalDepositos.value,
    destacado: false,
  },
  {
    key: 'gastos',
    label: 'Gastos de caja',
    signo: '-' as const,
    monto: totalGastosCaja.value,
    destacado: false,
  },
  {
    key: 'total',
    label: 'Total esperado en caja',
    signo: null,
    monto: cajaEsperada.value,
    destacado: true,
  },
])
</script>
