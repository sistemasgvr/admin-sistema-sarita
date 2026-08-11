<template>
  <div class="space-y-4">
    <div
      class="rounded-2xl border border-gray-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-white/[0.03] sm:px-5"
    >
      <div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div class="flex min-w-0 flex-wrap items-center gap-2">
          <h3 class="text-base font-semibold text-gray-800 dark:text-white/90">Libro diario</h3>
          <AppHelpTip
            text="Vista operativa del día / mes: ventas, cobranzas, gastos, depósitos y observaciones. Distinto del Resumen diario SUNAT."
          />
        </div>

        <div class="flex flex-wrap items-end gap-2">
          <AppFormField label="Desde" class="!w-auto min-w-[150px] shrink-0">
            <AppInput v-model="filters.fechaDesde" type="date" class="w-[160px]" />
          </AppFormField>
          <AppFormField label="Hasta" class="!w-auto min-w-[150px] shrink-0">
            <AppInput v-model="filters.fechaHasta" type="date" class="w-[160px]" />
          </AppFormField>
          <div class="min-w-[220px] shrink-0">
            <ClienteSelectField v-model="idClienteSelect" label="Cliente" />
          </div>
          <AppExportExcelButton :disabled="!libro" :on-export="exportarExcel" />
        </div>
      </div>

      <div
        v-if="canObservacion"
        class="mt-3 flex flex-wrap items-end gap-2 border-t border-gray-100 pt-3 dark:border-gray-800"
      >
        <AppFormField label="Nueva observación del día" class="min-w-[280px] flex-1">
          <AppInput
            v-model="nuevaObs"
            placeholder="Ej.: se compraron cilindros X/Y a Swiss Gas..."
          />
        </AppFormField>
        <button
          type="button"
          class="shrink-0 rounded-lg bg-brand-500 px-3 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-60"
          :disabled="!nuevaObs.trim() || crearObs.isPending.value"
          @click="agregarObservacion"
        >
          Agregar
        </button>
      </div>
    </div>

    <div v-if="isLoading" class="text-theme-sm text-gray-500">Cargando libro diario...</div>
    <div v-else-if="isError" class="text-theme-sm text-red-600">No se pudo cargar el libro diario.</div>

    <template v-else-if="libro">
      <AppSummaryCards :cards="resumenCards" :columns="5" />

      <div class="space-y-3">
        <AppCollapsibleSection
          v-model:open="ventasOpen"
          title="Ventas"
          :badge="String(libro.ventas.length)"
          :icon="ICONS.receipt"
        >
          <AppTable
            :columns="colsVentas"
            :rows="libro.ventas"
            empty-text="Sin ventas en el rango"
          >
            <template #actions="{ row }">
              <div class="inline-flex items-center justify-end gap-1.5">
                <button
                  type="button"
                  title="Ver detalle"
                  class="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-300 text-gray-600 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
                  @click="openVentaDetalle(row)"
                >
                  <AppIcon :name="ICONS.eye" :size="15" />
                </button>
                <AppActionMenu
                  :items="ventaActionItems(row)"
                  :execute="(key) => onVentaAction(key, row)"
                />
              </div>
            </template>
          </AppTable>
        </AppCollapsibleSection>

        <AppCollapsibleSection
          v-model:open="cobranzasOpen"
          title="Cobranzas"
          :badge="String(libro.cobranzas.length)"
          :icon="ICONS.wallet"
        >
          <AppTable
            :columns="colsCobranzas"
            :rows="libro.cobranzas"
            empty-text="Sin cobranzas en el rango"
          >
            <template #actions="{ row }">
              <div class="inline-flex items-center justify-end gap-1.5">
                <button
                  type="button"
                  title="Ver cuenta por cobrar"
                  class="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-300 text-gray-600 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
                  :disabled="!row.idCuenta"
                  @click="openCobranzaDetalle(row)"
                >
                  <AppIcon :name="ICONS.eye" :size="15" />
                </button>
                <AppActionMenu
                  :items="cobranzaActionItems(row)"
                  :execute="(key) => onCobranzaAction(key, row)"
                />
              </div>
            </template>
          </AppTable>
        </AppCollapsibleSection>

        <AppCollapsibleSection
          v-model:open="gastosOpen"
          title="Gastos"
          :badge="String(libro.gastos.length)"
          :icon="ICONS.arrowUpFromLine"
        >
          <AppTable
            :columns="colsGastos"
            :rows="libro.gastos"
            empty-text="Sin gastos en el rango"
          >
            <template #actions="{ row }">
              <button
                type="button"
                :title="gastoActionTitle(row)"
                class="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-300 text-gray-600 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
                @click="onGastoAction(row)"
              >
                <AppIcon
                  :name="row.origen === 'COMPRA' ? ICONS.eye : ICONS.externalLink"
                  :size="15"
                />
              </button>
            </template>
          </AppTable>
        </AppCollapsibleSection>

        <AppCollapsibleSection
          v-model:open="depositosOpen"
          title="Depósitos"
          :badge="String(libro.depositos.length)"
          :icon="ICONS.arrowDownToLine"
        >
          <AppTable
            :columns="colsDepositos"
            :rows="libro.depositos"
            empty-text="Sin depósitos en el rango"
          >
            <template #actions="{ row }">
              <button
                type="button"
                title="Ver en caja del día"
                class="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-300 text-gray-600 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
                @click="irACaja(row.fecha)"
              >
                <AppIcon :name="ICONS.externalLink" :size="15" />
              </button>
            </template>
          </AppTable>
        </AppCollapsibleSection>

        <AppCollapsibleSection
          v-model:open="obsOpen"
          title="Observaciones"
          :badge="String(libro.observaciones.length)"
          :icon="ICONS.messageSquare"
        >
          <AppTable
            :columns="colsObs"
            :rows="libro.observaciones"
            :show-actions="false"
            empty-text="Sin observaciones en el rango"
          />
        </AppCollapsibleSection>
      </div>
    </template>

    <ComprobanteDetailModal v-model="ventaModalOpen" :comprobante-id="ventaId" />
    <CompraDetailModal v-model="compraModalOpen" :compra-id="compraId" />
    <CuentaDetalleModal
      v-model="cuentaModalOpen"
      :cuenta-id="cuentaId"
      tipo="COBRAR"
      :can-anular="false"
      :can-registrar-pago="false"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import {
  AppActionMenu,
  AppCollapsibleSection,
  AppExportExcelButton,
  AppHelpTip,
  AppInput,
  AppSummaryCards,
  AppTable,
} from '@/shared/components'
import AppFormField from '@/shared/components/form/AppFormField.vue'
import AppIcon from '@/shared/components/AppIcon.vue'
import type { SummaryCardItem } from '@/shared/components/ui/AppSummaryCards.vue'
import type { ActionMenuItem } from '@/shared/interfaces/action-menu.interface'
import type { TableColumn } from '@/shared/interfaces/table.interface'
import ClienteSelectField from '@/modules/clientes/components/ClienteSelectField.vue'
import ComprobanteDetailModal from '@/modules/ventas/comprobantes/components/ComprobanteDetailModal.vue'
import CompraDetailModal from '@/modules/compras/components/CompraDetailModal.vue'
import CuentaDetalleModal from '@/modules/finanzas/components/CuentaDetalleModal.vue'
import {
  useCrearCajaObservacionMutation,
  useLibroDiarioQuery,
} from '@/modules/caja/composables/useCajaQuery'
import type {
  LibroDiarioCobranza,
  LibroDiarioFilters,
  LibroDiarioGasto,
  LibroDiarioVenta,
} from '@/modules/caja/interfaces/caja.interface'
import { exportarLibroDiarioExcel } from '@/modules/caja/utils/exportarLibroDiarioExcel'
import { comprobantesService } from '@/modules/ventas/comprobantes/services/comprobantes.service'
import {
  downloadBlob,
  openPdfPrintWindow,
  type ComprobantePdfFormato,
} from '@/modules/ventas/comprobantes/utils/comprobantePdf'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { ICONS } from '@/shared/constants/icons'
import { PermisoBanderas } from '@/shared/constants/permissions'
import { formatCurrency } from '@/shared/utils/currency'
import { toastApiError, toastSuccess, toastWarning } from '@/shared/composables/useToast'

function hoyLocal(): string {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

function esClienteVariosNombre(nombre?: string | null): boolean {
  return (nombre ?? '').trim().toUpperCase() === 'CLIENTES VARIOS'
}

const auth = useAuthStore()
const router = useRouter()
const filters = reactive<LibroDiarioFilters>({
  fechaDesde: hoyLocal(),
  fechaHasta: hoyLocal(),
})
const idClienteSelect = ref<string | number | undefined>(undefined)
watch(idClienteSelect, (v) => {
  filters.idCliente = v === '' || v == null ? undefined : Number(v)
})
const filtersRef = computed(() => ({
  fechaDesde: filters.fechaDesde,
  fechaHasta: filters.fechaHasta || undefined,
  idCliente: filters.idCliente,
}))
const query = useLibroDiarioQuery(filtersRef)
const libro = computed(() => query.data.value)
const isLoading = computed(() => query.isLoading.value)
const isError = computed(() => query.isError.value)

const canObservacion = computed(() => auth.hasPermission(PermisoBanderas.CAJA_OBSERVACION))
const nuevaObs = ref('')
const crearObs = useCrearCajaObservacionMutation()

const ventasOpen = ref(true)
const cobranzasOpen = ref(true)
const gastosOpen = ref(true)
const depositosOpen = ref(true)
const obsOpen = ref(true)

const ventaModalOpen = ref(false)
const ventaId = ref<number | null>(null)
const compraModalOpen = ref(false)
const compraId = ref<number | null>(null)
const cuentaModalOpen = ref(false)
const cuentaId = ref<number | null>(null)
const pdfBusyId = ref<number | null>(null)

async function agregarObservacion() {
  const texto = nuevaObs.value.trim()
  if (!texto) return
  await crearObs.mutateAsync({ fecha: filters.fechaDesde, texto })
  nuevaObs.value = ''
}

async function exportarExcel() {
  if (!libro.value) return
  await exportarLibroDiarioExcel(libro.value)
}

function openVentaDetalle(row: LibroDiarioVenta) {
  ventaId.value = row.id
  ventaModalOpen.value = true
}

function irACliente(idCliente?: number | null) {
  if (!idCliente) return
  void router.push({ name: 'admin-clientes-detalle', params: { id: String(idCliente) } })
}

function irACaja(fecha: string) {
  void router.push({ name: 'admin-ventas-caja', query: { fecha: fecha.slice(0, 10) } })
}

function ventaActionItems(row: LibroDiarioVenta): ActionMenuItem[] {
  const busy = pdfBusyId.value === row.id
  return [
    {
      key: 'cliente',
      label: 'Ver cliente',
      icon: ICONS.userCircle,
      hidden: !row.idCliente || esClienteVariosNombre(row.cliente),
    },
    {
      key: 'pdf-a4',
      label: 'Descargar PDF A4',
      icon: ICONS.download,
      disabled: busy,
    },
    {
      key: 'print-ticket',
      label: 'Imprimir ticket 80mm',
      icon: ICONS.printer,
      disabled: busy,
    },
  ]
}

function onVentaAction(key: string, row: LibroDiarioVenta) {
  switch (key) {
    case 'cliente':
      irACliente(row.idCliente)
      return
    case 'pdf-a4':
      return descargarPdf(row, 'a4')
    case 'print-ticket':
      return imprimirPdf(row, 'ticket')
  }
}

async function descargarPdf(row: LibroDiarioVenta, formato: ComprobantePdfFormato) {
  pdfBusyId.value = row.id
  try {
    const blob = await comprobantesService.obtenerPdf(row.id, formato)
    const nombre = row.serieNumero || `${row.serie ?? ''}-${row.numero ?? row.id}`
    downloadBlob(blob, `${nombre}-${formato}.pdf`)
    toastSuccess(formato === 'ticket' ? 'PDF ticketera 80mm descargado' : 'PDF A4 descargado')
  } catch (error) {
    toastApiError(error, 'No se pudo generar el documento')
  } finally {
    pdfBusyId.value = null
  }
}

async function imprimirPdf(row: LibroDiarioVenta, formato: ComprobantePdfFormato) {
  pdfBusyId.value = row.id
  const win = openPdfPrintWindow()
  if (!win) {
    pdfBusyId.value = null
    toastWarning(
      'El navegador bloqueó la ventana de impresión. Permite ventanas emergentes en la URL.',
    )
    return
  }
  try {
    const blob = await comprobantesService.obtenerPdf(row.id, formato)
    const url = URL.createObjectURL(blob)
    win.location.href = url
    win.focus()
    setTimeout(() => URL.revokeObjectURL(url), 60_000)
  } catch (error) {
    win.close()
    toastApiError(error, 'No se pudo abrir para imprimir')
  } finally {
    pdfBusyId.value = null
  }
}

function openCobranzaDetalle(row: LibroDiarioCobranza) {
  if (!row.idCuenta) return
  cuentaId.value = row.idCuenta
  cuentaModalOpen.value = true
}

function cobranzaActionItems(row: LibroDiarioCobranza): ActionMenuItem[] {
  return [
    {
      key: 'cliente',
      label: 'Ver cliente',
      icon: ICONS.userCircle,
      hidden: !row.idCliente || esClienteVariosNombre(row.cliente),
    },
  ]
}

function onCobranzaAction(key: string, row: LibroDiarioCobranza) {
  if (key === 'cliente') irACliente(row.idCliente)
}

function gastoActionTitle(row: LibroDiarioGasto) {
  return row.origen === 'COMPRA' ? 'Ver detalle de compra' : 'Ver en caja del día'
}

function onGastoAction(row: LibroDiarioGasto) {
  if (row.origen === 'COMPRA') {
    compraId.value = row.id
    compraModalOpen.value = true
    return
  }
  irACaja(row.fecha)
}

const resumenCards = computed<SummaryCardItem[]>(() => {
  const t = libro.value?.totales
  return [
    {
      key: 'contado',
      label: 'Ventas contado',
      value: formatCurrency(t?.ventasContado ?? 0),
      icon: ICONS.banknote,
      iconClass: 'bg-success-100 text-success-700 dark:bg-success-500/20 dark:text-success-300',
    },
    {
      key: 'credito',
      label: 'Ventas crédito',
      value: formatCurrency(t?.ventasCredito ?? 0),
      icon: ICONS.creditCard,
      iconClass: 'bg-brand-100 text-brand-600 dark:bg-brand-500/20 dark:text-brand-300',
    },
    {
      key: 'cobranzas',
      label: 'Cobranzas',
      value: formatCurrency(t?.cobranzas ?? 0),
      icon: ICONS.wallet,
      iconClass: 'bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300',
    },
    {
      key: 'gastos',
      label: 'Gastos',
      value: formatCurrency(t?.gastos ?? 0),
      icon: ICONS.arrowUpFromLine,
      iconClass: 'bg-error-100 text-error-700 dark:bg-error-500/20 dark:text-error-300',
    },
    {
      key: 'depositos',
      label: 'Depósitos',
      value: formatCurrency(t?.depositos ?? 0),
      icon: ICONS.arrowDownToLine,
      iconClass: 'bg-warning-100 text-warning-700 dark:bg-warning-500/20 dark:text-warning-300',
    },
  ]
})

const colsVentas: TableColumn[] = [
  { key: 'fecha', label: 'Fecha' },
  { key: 'serieNumero', label: 'Comprobante' },
  { key: 'tipoComprobante', label: 'Tipo' },
  { key: 'cliente', label: 'Cliente' },
  { key: 'detalleProductos', label: 'Detalle / m³' },
  { key: 'medioPago', label: 'Medio' },
  {
    key: 'totalImporte',
    label: 'Total',
    formatter: (v) => formatCurrency(Number(v ?? 0)),
  },
]

const colsCobranzas: TableColumn[] = [
  { key: 'fechaPago', label: 'Fecha' },
  { key: 'cliente', label: 'Cliente' },
  { key: 'medioPago', label: 'Medio' },
  { key: 'numeroOperacion', label: 'Operación' },
  { key: 'monto', label: 'Monto', formatter: (v) => formatCurrency(Number(v ?? 0)) },
]

const colsGastos: TableColumn[] = [
  { key: 'fecha', label: 'Fecha' },
  { key: 'origen', label: 'Origen' },
  { key: 'concepto', label: 'Concepto' },
  { key: 'medioPago', label: 'Medio' },
  { key: 'monto', label: 'Monto', formatter: (v) => formatCurrency(Number(v ?? 0)) },
]

const colsDepositos: TableColumn[] = [
  { key: 'fecha', label: 'Fecha' },
  { key: 'cuentaBancaria', label: 'Cuenta' },
  { key: 'numeroOperacion', label: 'Operación' },
  { key: 'monto', label: 'Monto', formatter: (v) => formatCurrency(Number(v ?? 0)) },
]

const colsObs: TableColumn[] = [
  { key: 'fecha', label: 'Fecha' },
  { key: 'texto', label: 'Observación' },
  { key: 'usuario', label: 'Usuario' },
]
</script>
