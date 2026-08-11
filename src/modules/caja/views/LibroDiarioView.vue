<template>
  <div class="space-y-5">
    <div
      class="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03] sm:p-5"
    >
      <div class="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h3 class="text-base font-semibold text-gray-800 dark:text-white/90">Libro diario</h3>
          <p class="mt-1 text-theme-sm text-gray-500 dark:text-gray-400">
            Vista operativa del día / mes: ventas, cobranzas, gastos, depósitos y observaciones.
            Distinto del Resumen diario SUNAT.
          </p>
        </div>
        <div class="flex flex-wrap gap-3">
          <AppFormField label="Desde" class="min-w-[150px]">
            <AppInput v-model="filters.fechaDesde" type="date" />
          </AppFormField>
          <AppFormField label="Hasta" class="min-w-[150px]">
            <AppInput v-model="filters.fechaHasta" type="date" />
          </AppFormField>
          <div class="min-w-[220px]">
            <ClienteSelectField v-model="idClienteSelect" label="Cliente" />
          </div>
        </div>
      </div>

      <div v-if="canObservacion" class="mt-4 flex flex-wrap items-end gap-2">
        <AppFormField label="Nueva observación del día" class="min-w-[280px] flex-1">
          <AppInput v-model="nuevaObs" placeholder="Ej.: se compraron cilindros X/Y a Swiss Gas..." />
        </AppFormField>
        <button
          type="button"
          class="rounded-lg bg-brand-500 px-3 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-60"
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
      <AppSummaryCards :cards="resumenCards" />

      <section class="space-y-3">
        <h4 class="text-sm font-semibold text-gray-800 dark:text-white/90">Ventas</h4>
        <AppTable :columns="colsVentas" :rows="libro.ventas" empty-text="Sin ventas en el rango" />
      </section>

      <section class="space-y-3">
        <h4 class="text-sm font-semibold text-gray-800 dark:text-white/90">Cobranzas</h4>
        <AppTable
          :columns="colsCobranzas"
          :rows="libro.cobranzas"
          empty-text="Sin cobranzas en el rango"
        />
      </section>

      <section class="space-y-3">
        <h4 class="text-sm font-semibold text-gray-800 dark:text-white/90">Gastos</h4>
        <AppTable :columns="colsGastos" :rows="libro.gastos" empty-text="Sin gastos en el rango" />
      </section>

      <section class="space-y-3">
        <h4 class="text-sm font-semibold text-gray-800 dark:text-white/90">Depósitos</h4>
        <AppTable
          :columns="colsDepositos"
          :rows="libro.depositos"
          empty-text="Sin depósitos en el rango"
        />
      </section>

      <section class="space-y-3">
        <h4 class="text-sm font-semibold text-gray-800 dark:text-white/90">Observaciones</h4>
        <AppTable
          :columns="colsObs"
          :rows="libro.observaciones"
          empty-text="Sin observaciones en el rango"
        />
      </section>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { AppInput, AppSummaryCards, AppTable } from '@/shared/components'
import AppFormField from '@/shared/components/form/AppFormField.vue'
import type { SummaryCardItem } from '@/shared/components/ui/AppSummaryCards.vue'
import type { TableColumn } from '@/shared/interfaces/table.interface'
import ClienteSelectField from '@/modules/clientes/components/ClienteSelectField.vue'
import {
  useCrearCajaObservacionMutation,
  useLibroDiarioQuery,
} from '@/modules/caja/composables/useCajaQuery'
import type { LibroDiarioFilters } from '@/modules/caja/interfaces/caja.interface'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { PermisoBanderas } from '@/shared/constants/permissions'
import { formatCurrency } from '@/shared/utils/currency'

function hoyLocal(): string {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

const auth = useAuthStore()
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

async function agregarObservacion() {
  const texto = nuevaObs.value.trim()
  if (!texto) return
  await crearObs.mutateAsync({ fecha: filters.fechaDesde, texto })
  nuevaObs.value = ''
}

const resumenCards = computed<SummaryCardItem[]>(() => {
  const t = libro.value?.totales
  return [
    { label: 'Ventas contado', value: formatCurrency(t?.ventasContado ?? 0) },
    { label: 'Ventas crédito', value: formatCurrency(t?.ventasCredito ?? 0) },
    { label: 'Cobranzas', value: formatCurrency(t?.cobranzas ?? 0) },
    { label: 'Gastos', value: formatCurrency(t?.gastos ?? 0) },
    { label: 'Depósitos', value: formatCurrency(t?.depositos ?? 0) },
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
