<template>
  <div>
    <PageBreadcrumb page-title="Caja" :items="breadcrumbItems" />

    <div class="space-y-4">
      <div
        class="rounded-2xl border border-gray-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-white/[0.03] sm:px-5"
      >
        <div class="flex flex-col gap-3 lg:flex-row lg:items-end">
          <div class="min-w-0 lg:max-w-xs lg:shrink">
            <div class="flex flex-wrap items-center gap-2">
              <h3 class="text-base font-semibold text-gray-800 dark:text-white/90">
                Caja / arqueo
              </h3>
              <AppHelpTip
                text="Control operativo del día: abrir, registrar/anular gastos y depósitos, y cerrar. Con caja cerrada no se anulan movimientos. No reemplaza el Resumen diario SUNAT."
              />
              <AppBadge
                v-if="sesion?.estadoCaja"
                :color="sesion.estadoCaja === 'ABIERTA' ? 'success' : 'warning'"
              >
                {{ sesion.estadoCaja }}
              </AppBadge>
              <AppBadge v-else-if="!isLoading" color="neutral">SIN APERTURA</AppBadge>
              <button
                type="button"
                class="text-theme-sm font-medium text-brand-600 hover:underline dark:text-brand-400"
                @click="showHistorial = true"
              >
                Historial
              </button>
              <RouterLink
                :to="{ name: 'admin-ventas-caja-historial' }"
                class="text-theme-sm font-medium text-gray-500 hover:underline dark:text-gray-400"
              >
                Sesiones
              </RouterLink>
            </div>
            <p
              v-if="sesion?.id"
              class="mt-0.5 text-theme-sm text-gray-500 dark:text-gray-400 lg:truncate"
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

          <div class="grid w-full grid-cols-2 gap-2 sm:max-w-md lg:flex lg:w-auto lg:max-w-none lg:shrink-0">
            <div class="min-w-0 lg:w-[10.5rem]">
              <AppFormField label="Fecha">
                <AppInput v-model="fecha" type="date" />
              </AppFormField>
            </div>
            <div class="min-w-0 lg:w-[12rem]">
              <AppSelect
                v-model="idSucursalSelect"
                label="Sucursal"
                :options="sucursalOptions"
                placeholder="Todas"
              />
            </div>
          </div>

          <div class="flex w-full flex-wrap gap-2 lg:ml-auto lg:w-auto lg:shrink-0 lg:items-end">
            <button
              v-if="canAbrir && !sesion?.id && !pendienteCierreSucursal"
              type="button"
              class="flex-1 rounded-lg bg-brand-500 px-3 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60 sm:flex-none"
              :disabled="idSucursal == null"
              :title="idSucursal == null ? 'Selecciona una sucursal para abrir caja' : 'Abrir caja'"
              @click="showAbrir = true"
            >
              Abrir caja
            </button>
            <button
              v-if="
                canAbrir &&
                sesion?.estadoCaja === 'CERRADA' &&
                !pendienteCierreSucursal
              "
              type="button"
              class="flex-1 rounded-lg bg-brand-500 px-3 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60 sm:flex-none"
              :disabled="idSucursal == null"
              :title="idSucursal == null ? 'Selecciona una sucursal para reabrir caja' : 'Reabrir caja'"
              @click="showAbrir = true"
            >
              Reabrir caja
            </button>
            <button
              v-if="canGasto && sesion?.estadoCaja === 'ABIERTA'"
              type="button"
              class="min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 sm:flex-none dark:border-gray-700 dark:text-gray-300"
              @click="showGasto = true"
            >
              Gasto
            </button>
            <button
              v-if="canDeposito && sesion?.estadoCaja === 'ABIERTA'"
              type="button"
              class="min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 sm:flex-none dark:border-gray-700 dark:text-gray-300"
              @click="showDeposito = true"
            >
              Depósito
            </button>
            <button
              v-if="canCerrar && sesion?.id && sesion.estadoCaja === 'ABIERTA'"
              type="button"
              class="min-w-0 flex-1 rounded-lg bg-gray-900 px-3 py-2.5 text-sm font-medium text-white hover:bg-gray-800 sm:flex-none dark:bg-white/10"
              @click="showCerrar = true"
            >
              Cerrar caja
            </button>
          </div>
        </div>
      </div>

      <div
        v-if="bannerPendiente"
        class="flex flex-col gap-3 rounded-xl border border-error-200 bg-error-50 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between dark:border-error-500/30 dark:bg-error-500/10"
      >
        <div class="flex items-start gap-3">
          <AppIcon
            :name="ICONS.alertTriangle"
            :size="18"
            class="mt-0.5 shrink-0 text-error-600 dark:text-error-300"
          />
          <div>
            <p class="text-sm font-semibold text-error-900 dark:text-error-200">
              Cierre diario pendiente
            </p>
            <p class="mt-0.5 text-theme-sm text-error-800 dark:text-error-300">
              {{ bannerPendiente }}
            </p>
          </div>
        </div>
        <button
          v-if="debeIrAPendienteCerrar"
          type="button"
          class="shrink-0 rounded-lg bg-brand-500 px-3 py-2 text-sm font-medium text-white hover:bg-brand-600"
          @click="irAPendienteCerrar"
        >
          Ir a cerrar {{ formatListDate(fechaPendienteCerrar) }}
        </button>
        <button
          v-else-if="
            canCerrar &&
            sesion?.estadoCaja === 'ABIERTA' &&
            esFechaPendiente &&
            esSucursalPendiente
          "
          type="button"
          class="shrink-0 rounded-lg bg-brand-500 px-3 py-2 text-sm font-medium text-white hover:bg-brand-600"
          @click="showCerrar = true"
        >
          Cerrar ahora
        </button>
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

        <div class="grid items-stretch gap-3 xl:grid-cols-3">
          <div class="min-h-0 xl:col-span-2 xl:h-full">
            <AppSummaryCards
              class="!mb-0 grid-cols-2"
              :cards="resumenCards"
              :columns="3"
              stretch
            />
          </div>

          <div
            class="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]"
          >
          <div class="mb-3 flex items-center gap-2">
            <h4 class="text-sm font-semibold text-gray-800 dark:text-white/90">
              Dinero que debería haber
            </h4>
            <AppHelpTip
              text="Suma lo que entra a caja (fondo, ventas, cobranzas y cobros de garantía en efectivo/Yape/Plin) y resta lo que sale (depósitos al banco, gastos menudos y devoluciones de garantía)."
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
        </div>

        <div v-if="sesion?.id" class="grid grid-cols-1 items-start gap-3 lg:grid-cols-2">
          <AppCollapsibleSection
            v-model:open="gastosOpen"
            title="Gastos de caja"
            :badge="String(gastos.length)"
            :icon="ICONS.arrowUpFromLine"
            class="self-start"
          >
            <ul
              v-if="gastos.length"
              class="max-h-56 divide-y divide-gray-100 overflow-y-auto dark:divide-gray-800"
            >
              <li
                v-for="g in gastos"
                :key="g.id"
                class="flex items-start justify-between gap-3 py-2 text-theme-sm first:pt-0 last:pb-0"
              >
                <div class="min-w-0">
                  <p class="truncate font-medium text-gray-800 dark:text-white/90">{{ g.concepto }}</p>
                  <p class="text-gray-500 dark:text-gray-400">
                    {{ g.medioPago || '—' }}
                    <span v-if="g.numeroOperacion">· {{ g.numeroOperacion }}</span>
                  </p>
                </div>
                <div class="flex shrink-0 items-center gap-2">
                  <span class="tabular-nums font-medium text-gray-800 dark:text-white/90">
                    {{ formatCurrency(g.monto) }}
                  </span>
                  <button
                    v-if="canAnularGasto"
                    type="button"
                    class="inline-flex h-8 w-8 items-center justify-center rounded-lg text-error-500 hover:bg-error-50 dark:hover:bg-error-500/10"
                    title="Anular gasto"
                    @click="pedirAnularGasto(g)"
                  >
                    <AppIcon :name="ICONS.trash" :size="16" />
                  </button>
                </div>
              </li>
            </ul>
            <p v-else class="text-theme-sm text-gray-500 dark:text-gray-400">Sin gastos.</p>
            <p
              v-if="gastos.length && !canAnularGasto"
              class="mt-2 text-[11px] text-gray-400 dark:text-gray-500"
            >
              Para anular un gasto, la caja debe estar abierta.
            </p>
          </AppCollapsibleSection>

          <AppCollapsibleSection
            v-model:open="depositosOpen"
            title="Depósitos"
            :badge="String(depositos.length)"
            :icon="ICONS.arrowDownToLine"
            class="self-start"
          >
            <ul
              v-if="depositos.length"
              class="max-h-56 divide-y divide-gray-100 overflow-y-auto dark:divide-gray-800"
            >
              <li
                v-for="d in depositos"
                :key="d.id"
                class="flex items-start justify-between gap-3 py-2 text-theme-sm first:pt-0 last:pb-0"
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
                <div class="flex shrink-0 items-center gap-2">
                  <span class="tabular-nums font-medium text-gray-800 dark:text-white/90">
                    {{ formatCurrency(d.monto) }}
                  </span>
                  <button
                    v-if="canAnularDeposito"
                    type="button"
                    class="inline-flex h-8 w-8 items-center justify-center rounded-lg text-error-500 hover:bg-error-50 dark:hover:bg-error-500/10"
                    title="Anular depósito"
                    @click="pedirAnularDeposito(d)"
                  >
                    <AppIcon :name="ICONS.trash" :size="16" />
                  </button>
                </div>
              </li>
            </ul>
            <p v-else class="text-theme-sm text-gray-500 dark:text-gray-400">Sin depósitos.</p>
            <p
              v-if="depositos.length && !canAnularDeposito"
              class="mt-2 text-[11px] text-gray-400 dark:text-gray-500"
            >
              Para anular un depósito, la caja debe estar abierta.
            </p>
          </AppCollapsibleSection>
        </div>
      </template>

      <AbrirCajaModal
        v-model="showAbrir"
        :fecha="fecha"
        :id-sucursal="idSucursal"
        :es-reapertura="sesion?.estadoCaja === 'CERRADA'"
        :id-sesion="sesion?.id"
        :monto-inicial-anterior="sesion?.montoInicial"
      />
      <CerrarCajaModal
        v-if="sesion?.id"
        v-model="showCerrar"
        :id-sesion="sesion.id"
        :caja-esperada="cajaEsperada"
      />
      <RegistrarGastoCajaModal
        v-model="showGasto"
        :fecha="fecha"
        :id-sesion="sesion?.id"
        :id-sucursal="idSucursal"
      />
      <RegistrarDepositoCajaModal
        v-model="showDeposito"
        :fecha="fecha"
        :id-sesion="sesion?.id"
        :id-sucursal="idSucursal"
      />

      <HistorialCajaModal v-model="showHistorial" :fecha="fecha" :id-sucursal="idSucursal" />

      <AppConfirmDialog
        v-model="confirmAnularOpen"
        :title="confirmAnularTitulo"
        variant="danger"
        confirm-label="Sí, anular"
        loading-label="Anulando..."
        :loading="anulando"
        @confirm="confirmarAnular"
      >
        <span>
          ¿Anular este movimiento? Se quitará del arqueo del día. Solo es posible con la caja
          <strong>abierta</strong>. Para corregir un monto, anula y registra uno nuevo.
        </span>
      </AppConfirmDialog>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import PageBreadcrumb from '@/modules/admin/components/PageBreadcrumb.vue'
import { ventasBreadcrumbItems } from '@/modules/ventas/config/ventas-breadcrumb'
import {
  AppBadge,
  AppCollapsibleSection,
  AppConfirmDialog,
  AppHelpTip,
  AppInput,
  AppSelect,
  AppSummaryCards,
} from '@/shared/components'
import AppFormField from '@/shared/components/form/AppFormField.vue'
import AppIcon from '@/shared/components/AppIcon.vue'
import type { SummaryCardItem } from '@/shared/components/ui/AppSummaryCards.vue'
import AbrirCajaModal from '@/modules/caja/components/AbrirCajaModal.vue'
import CerrarCajaModal from '@/modules/caja/components/CerrarCajaModal.vue'
import RegistrarGastoCajaModal from '@/modules/caja/components/RegistrarGastoCajaModal.vue'
import RegistrarDepositoCajaModal from '@/modules/caja/components/RegistrarDepositoCajaModal.vue'
import HistorialCajaModal from '@/modules/caja/components/HistorialCajaModal.vue'
import {
  useCajaDiaQuery,
  useCajaPendienteCierreQuery,
  useEliminarCajaDepositoMutation,
  useEliminarCajaGastoMutation,
} from '@/modules/caja/composables/useCajaQuery'
import type {
  CajaMovimientoDeposito,
  CajaMovimientoGasto,
} from '@/modules/caja/interfaces/caja.interface'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { useSucursalesQuery } from '@/modules/configuracion/sucursales/composables/useSucursalesQuery'
import { ICONS } from '@/shared/constants/icons'
import { PermisoBanderas } from '@/shared/constants/permissions'
import { formatCurrency } from '@/shared/utils/currency'
import { formatListDate, hoyIsoLima } from '@/shared/utils/date'
import { toastWarning } from '@/shared/composables/useToast'

const breadcrumbItems = ventasBreadcrumbItems('Caja')

function hoyLocal(): string {
  return hoyIsoLima()
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
    timeZone: 'America/Lima',
  })
}

const auth = useAuthStore()
const route = useRoute()

function fechaInicial(): string {
  const raw = route.query.fecha
  const value = Array.isArray(raw) ? raw[0] : raw
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value
  return hoyLocal()
}

const fecha = ref(fechaInicial())
const idSucursal = ref<number | null>(null)
const showHistorial = ref(false)
const sucursalesFilters = ref({ pagina: 1, limite: 100 })
const sucursalesQuery = useSucursalesQuery(sucursalesFilters)
const sucursalOptions = computed(() => [
  { value: '', label: 'Todas' },
  ...(sucursalesQuery.data.value?.data ?? []).map((s) => ({
    value: s.id,
    label: s.nombre,
  })),
])
const idSucursalSelect = computed({
  get: () => idSucursal.value ?? '',
  set: (value: string | number | null) => {
    idSucursal.value = value === '' || value == null ? null : Number(value)
  },
})
const showAbrir = ref(false)
const showCerrar = ref(false)
const showGasto = ref(false)
const showDeposito = ref(false)
const gastosOpen = ref(false)
const depositosOpen = ref(false)
const confirmAnularOpen = ref(false)
const anularTipo = ref<'gasto' | 'deposito' | null>(null)
const anularId = ref<number | null>(null)

const query = useCajaDiaQuery(fecha, idSucursal)
// The "Caja del día" snapshot must remain sucursal-scoped, but the pending-close
// warning banner must be sucursal-global.
const pendienteQuerySucursal = useCajaPendienteCierreQuery(idSucursal)
const pendienteQueryGlobal = useCajaPendienteCierreQuery()
const eliminarGastoMutation = useEliminarCajaGastoMutation()
const eliminarDepositoMutation = useEliminarCajaDepositoMutation()
const sesion = computed(() => query.data.value)
const isLoading = computed(() => query.isLoading.value)
const isError = computed(() => query.isError.value)
const cajaAbierta = computed(() => sesion.value?.estadoCaja === 'ABIERTA')

const pendienteCierreSucursal = computed(
  () => pendienteQuerySucursal.data.value?.data?.[0] ?? null,
)
const pendienteCierreGlobal = computed(
  () => pendienteQueryGlobal.data.value?.data?.[0] ?? null,
)
const pendienteIdSucursal = computed(() => pendienteCierreGlobal.value?.idSucursal ?? null)
const fechaPendienteCerrar = computed(() =>
  pendienteCierreGlobal.value?.fecha
    ? String(pendienteCierreGlobal.value.fecha).slice(0, 10)
    : null,
)
const esFechaPendiente = computed(
  () => Boolean(fechaPendienteCerrar.value) && fecha.value === fechaPendienteCerrar.value,
)
const esSucursalPendiente = computed(
  () => idSucursal.value === pendienteIdSucursal.value,
)
const bannerPendiente = computed(() => {
  if (!pendienteCierreGlobal.value || !fechaPendienteCerrar.value) return null
  const f = formatListDate(fechaPendienteCerrar.value)
  const dias = pendienteCierreGlobal.value.diasAbierta ?? 1
  if (esFechaPendiente.value) {
    return `Esta caja del ${f} quedó abierta (${dias} día${dias === 1 ? '' : 's'}). Haz el arqueo y ciérrala para poder abrir la de hoy.`
  }
  return `Hay una caja sin cerrar del ${f} (${dias} día${dias === 1 ? '' : 's'}). Ciérrala antes de abrir u operar la de hoy.`
})
const debeIrAPendienteCerrar = computed(
  () =>
    Boolean(fechaPendienteCerrar.value) &&
    (!esFechaPendiente.value || !esSucursalPendiente.value),
)

function irAPendienteCerrar() {
  if (!fechaPendienteCerrar.value) return
  // Move the UI to the pending-close session (date + its sucursal),
  // while keeping the rest of "Caja del día" logic sucursal-scoped.
  fecha.value = fechaPendienteCerrar.value
  idSucursal.value = pendienteIdSucursal.value
}
const anulando = computed(
  () =>
    eliminarGastoMutation.isPending.value || eliminarDepositoMutation.isPending.value,
)
const confirmAnularTitulo = computed(() =>
  anularTipo.value === 'deposito' ? 'Anular depósito' : 'Anular gasto',
)

const totales = computed(() => sesion.value?.totales)
const gastos = computed(() => sesion.value?.gastos ?? [])
const depositos = computed(() => sesion.value?.depositos ?? [])

const montoInicial = computed(() => Number(sesion.value?.montoInicial ?? 0))
const ventasMediosCaja = computed(() => Number(totales.value?.ventasMediosCaja ?? 0))
const cobranzasMediosCaja = computed(() => Number(totales.value?.cobranzasMediosCaja ?? 0))
const garantiasCobroMediosCaja = computed(() =>
  Number(totales.value?.garantiasCobroMediosCaja ?? 0),
)
const totalDepositos = computed(() => Number(totales.value?.depositos ?? 0))
const totalGastosCaja = computed(() => Number(totales.value?.gastosCaja ?? 0))
const garantiasDevolucionMediosCaja = computed(() =>
  Number(totales.value?.garantiasDevolucionMediosCaja ?? 0),
)

const cajaEsperada = computed(
  () =>
    sesion.value?.cajaEsperada ??
    montoInicial.value +
      ventasMediosCaja.value +
      cobranzasMediosCaja.value +
      garantiasCobroMediosCaja.value -
      totalDepositos.value -
      totalGastosCaja.value -
      garantiasDevolucionMediosCaja.value,
)

const canAbrir = computed(() => auth.hasPermission(PermisoBanderas.CAJA_ABRIR))
const canCerrar = computed(() => auth.hasPermission(PermisoBanderas.CAJA_CERRAR))
const canGasto = computed(() => auth.hasPermission(PermisoBanderas.CAJA_REGISTRAR_GASTO))
const canDeposito = computed(() => auth.hasPermission(PermisoBanderas.CAJA_REGISTRAR_DEPOSITO))
const canAnularGasto = computed(() => canGasto.value && cajaAbierta.value)
const canAnularDeposito = computed(() => canDeposito.value && cajaAbierta.value)

function pedirAnularGasto(g: CajaMovimientoGasto) {
  if (!canAnularGasto.value) {
    toastWarning('Solo se puede anular un gasto con la caja abierta')
    return
  }
  anularTipo.value = 'gasto'
  anularId.value = g.id
  confirmAnularOpen.value = true
}

function pedirAnularDeposito(d: CajaMovimientoDeposito) {
  if (!canAnularDeposito.value) {
    toastWarning('Solo se puede anular un depósito con la caja abierta')
    return
  }
  anularTipo.value = 'deposito'
  anularId.value = d.id
  confirmAnularOpen.value = true
}

async function confirmarAnular() {
  if (!anularId.value || !anularTipo.value) return
  try {
    if (anularTipo.value === 'gasto') {
      await eliminarGastoMutation.mutateAsync(anularId.value)
    } else {
      await eliminarDepositoMutation.mutateAsync(anularId.value)
    }
    confirmAnularOpen.value = false
    anularId.value = null
    anularTipo.value = null
  } catch {
    // toast en la mutación
  }
}

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
    key: 'garantias',
    label: 'Garantías (neto caja)',
    value: formatCurrency(
      Number(totales.value?.garantiasCobroMediosCaja ?? 0) -
        Number(totales.value?.garantiasDevolucionMediosCaja ?? 0),
    ),
    icon: ICONS.wallet,
    iconClass: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300',
  },
  {
    key: 'depositos',
    label: 'Depósitos',
    value: formatCurrency(totales.value?.depositos ?? 0),
    icon: ICONS.arrowDownToLine,
    iconClass: 'bg-warning-100 text-warning-700 dark:bg-warning-500/20 dark:text-warning-300',
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
    label: 'Ventas efectivo / Yape / Plin',
    signo: '+' as const,
    monto: ventasMediosCaja.value,
    destacado: false,
  },
  {
    key: 'cobranzas',
    label: 'Cobranzas efectivo / Yape / Plin',
    signo: '+' as const,
    monto: cobranzasMediosCaja.value,
    destacado: false,
  },
  {
    key: 'garantiasCobro',
    label: 'Cobro garantías (sin CPE)',
    signo: '+' as const,
    monto: garantiasCobroMediosCaja.value,
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
    key: 'garantiasDev',
    label: 'Devolución garantías',
    signo: '-' as const,
    monto: garantiasDevolucionMediosCaja.value,
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
