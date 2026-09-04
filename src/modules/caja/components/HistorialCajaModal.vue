<template>
  <AppModal
    v-model="open"
    title="Historial de caja"
    subtitle="Movimientos del día o del rango, agrupados por resumen."
    size="xl"
  >
    <div class="space-y-4">
      <!-- Filtros -->
      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <AppFormField label="Desde">
          <AppDatePicker v-model="fechaDesde" />
        </AppFormField>
        <AppFormField label="Hasta">
          <AppDatePicker v-model="fechaHasta" :min="fechaDesde" />
        </AppFormField>
      </div>

      <!-- Pestañas: las define el backend, no están escritas aquí -->
      <div
        v-if="resumenes.length"
        class="flex flex-wrap gap-1 border-b border-gray-200 pb-px dark:border-gray-800"
        role="tablist"
      >
        <button
          v-for="resumen in resumenes"
          :key="resumen.clave"
          type="button"
          role="tab"
          :aria-selected="resumen.clave === claveActiva"
          class="rounded-t-lg px-3 py-2 text-sm font-medium transition"
          :class="
            resumen.clave === claveActiva
              ? 'bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400'
              : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/[0.03]'
          "
          @click="claveActiva = resumen.clave"
        >
          {{ resumen.etiqueta }}
          <span class="ml-1 text-theme-xs text-gray-400">({{ resumen.cantidad }})</span>
        </button>
      </div>

      <!-- Cabecera del resumen activo -->
      <div
        v-if="resumenActivo"
        class="flex flex-wrap items-baseline justify-between gap-2 rounded-lg bg-gray-50 px-3 py-2 dark:bg-white/[0.03]"
      >
        <p class="text-sm text-gray-600 dark:text-gray-300">
          {{ resumenActivo.etiqueta }} · {{ resumenActivo.cantidad }} registro(s)
        </p>
        <p v-if="resumenActivo.total !== null" class="text-sm font-semibold" :class="colorSigno">
          {{ signoTexto }}{{ formatCurrency(resumenActivo.total) }}
        </p>
      </div>

      <AppTable
        :columns="columnasActivas"
        :rows="filasActivas"
        row-key="rowKey"
        :loading="query.isLoading.value"
        :empty-text="`Sin movimientos en ${resumenActivo?.etiqueta.toLowerCase() ?? 'este resumen'}`"
      >
        <template #cell-monto="{ row }">
          <span class="font-medium tabular-nums">{{ formatCurrency(Number(row.monto ?? 0)) }}</span>
        </template>
      </AppTable>
    </div>

    <template #footer>
      <button
        type="button"
        class="flex w-full justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 sm:w-auto"
        @click="open = false"
      >
        Cerrar
      </button>
      <AppExportExcelButton :disabled="!libro" :on-export="exportar" />
    </template>
  </AppModal>
</template>

<script setup lang="ts">
/**
 * Historial de caja como modal con pestañas por resumen (plan F3, apuntes 1.a.ii
 * y 1.b.i).
 *
 * Las pestañas NO están escritas aquí: `fin_obtener_libro_diario` devuelve
 * `resumenes`, donde cada entrada dice de qué array del payload salen sus filas
 * y con qué filtro. Añadir un resumen nuevo en el backend lo hace aparecer sin
 * tocar este componente; lo único que vive aquí son las columnas, que son
 * presentación pura.
 */
import { computed, ref, watch } from 'vue'
import { AppExportExcelButton, AppModal, AppTable } from '@/shared/components'
import AppDatePicker from '@/shared/components/form/AppDatePicker.vue'
import AppFormField from '@/shared/components/form/AppFormField.vue'
import { useLibroDiarioQuery } from '@/modules/caja/composables/useCajaQuery'
import { exportarLibroDiarioExcel } from '@/modules/caja/utils/exportarLibroDiarioExcel'
import type {
  LibroDiario,
  LibroDiarioFilters,
  LibroDiarioResumen,
} from '@/modules/caja/interfaces/caja.interface'
import { formatCurrency } from '@/shared/utils/currency'
import { formatListDate } from '@/shared/utils/date'
import type { TableColumn } from '@/shared/interfaces/table.interface'

const open = defineModel<boolean>({ default: false })

const props = withDefaults(
  defineProps<{
    /** Fecha inicial; por defecto, hoy. */
    fecha?: string
    /** Sucursal del contexto de caja. La caja es por sucursal, así que no se elige aquí. */
    idSucursal?: number | null
  }>(),
  { fecha: undefined, idSucursal: null },
)

const hoy = () => new Date().toISOString().slice(0, 10)

// Vacías mientras el modal está cerrado: `useLibroDiarioQuery` se deshabilita
// solo cuando no hay fechaDesde, así que no se consulta hasta abrirlo.
const fechaDesde = ref('')
const fechaHasta = ref('')
const claveActiva = ref('')

watch(open, (abierto) => {
  if (!abierto) return
  fechaDesde.value = props.fecha ?? hoy()
  fechaHasta.value = props.fecha ?? hoy()
})

const filtros = computed<LibroDiarioFilters>(() => ({
  fechaDesde: fechaDesde.value,
  fechaHasta: fechaHasta.value || fechaDesde.value,
  idSucursal: props.idSucursal,
}))

const query = useLibroDiarioQuery(filtros)
const libro = computed<LibroDiario | null>(() => query.data.value ?? null)

const resumenes = computed<LibroDiarioResumen[]>(() => libro.value?.resumenes ?? [])

// La pestaña activa se conserva entre recargas mientras siga existiendo.
watch(
  resumenes,
  (lista) => {
    if (!lista.length) return
    if (!lista.some((r) => r.clave === claveActiva.value)) claveActiva.value = lista[0].clave
  },
  { immediate: true },
)

const resumenActivo = computed<LibroDiarioResumen | null>(
  () => resumenes.value.find((r) => r.clave === claveActiva.value) ?? null,
)

const signoTexto = computed(() =>
  resumenActivo.value?.signo === -1 ? '−' : resumenActivo.value?.signo === 1 ? '+' : '',
)
const colorSigno = computed(() =>
  resumenActivo.value?.signo === -1
    ? 'text-error-500'
    : resumenActivo.value?.signo === 1
      ? 'text-success-600 dark:text-success-500'
      : 'text-gray-700 dark:text-gray-200',
)

type FilaResumen = Record<string, unknown> & { rowKey: string }

const filasActivas = computed<FilaResumen[]>(() => {
  const resumen = resumenActivo.value
  const datos = libro.value
  if (!resumen || !datos) return []

  // El backend dice de qué array salen las filas, así que el tipo concreto se
  // resuelve en tiempo de ejecución; las columnas ya acotan qué se muestra.
  const coleccion = (datos[resumen.coleccion] ?? []) as unknown as Array<Record<string, unknown>>
  const filtradas = resumen.filtroCampo
    ? coleccion.filter((fila) => fila[resumen.filtroCampo as string] === resumen.filtroValor)
    : coleccion

  return filtradas.map((fila, i) => ({ ...fila, rowKey: `${resumen.clave}-${i}` }))
})

const celdaFecha = (v: unknown) => (v ? formatListDate(String(v)) : '—')

/** Columnas por colección: presentación pura, por eso vive en el frontend. */
const COLUMNAS: Record<string, TableColumn[]> = {
  ventasPagos: [
    { key: 'fecha', label: 'Fecha', formatter: celdaFecha },
    { key: 'serieNumero', label: 'Comprobante' },
    { key: 'cliente', label: 'Cliente' },
    { key: 'medioPago', label: 'Medio' },
    { key: 'cuentaBancaria', label: 'Cuenta' },
    { key: 'numeroOperacion', label: 'N° op.' },
    { key: 'monto', label: 'Monto', align: 'right' },
  ],
  cobranzas: [
    { key: 'fechaPago', label: 'Fecha', formatter: celdaFecha },
    { key: 'cliente', label: 'Cliente' },
    { key: 'medioPago', label: 'Medio' },
    { key: 'cuentaBancaria', label: 'Cuenta' },
    { key: 'numeroOperacion', label: 'N° op.' },
    { key: 'monto', label: 'Monto', align: 'right' },
  ],
  garantias: [
    { key: 'fecha', label: 'Fecha', formatter: celdaFecha },
    { key: 'cliente', label: 'Cliente' },
    { key: 'medioPago', label: 'Medio' },
    { key: 'cuentaBancaria', label: 'Cuenta' },
    { key: 'numeroOperacion', label: 'N° op.' },
    { key: 'monto', label: 'Monto', align: 'right' },
  ],
  gastos: [
    { key: 'fecha', label: 'Fecha', formatter: celdaFecha },
    { key: 'concepto', label: 'Concepto' },
    { key: 'origen', label: 'Origen' },
    { key: 'medioPago', label: 'Medio' },
    { key: 'cuentaBancaria', label: 'Cuenta' },
    { key: 'monto', label: 'Monto', align: 'right' },
  ],
  depositos: [
    { key: 'fecha', label: 'Fecha', formatter: celdaFecha },
    { key: 'cuentaBancaria', label: 'Cuenta destino' },
    { key: 'medioPago', label: 'Medio' },
    { key: 'numeroOperacion', label: 'N° op.' },
    { key: 'monto', label: 'Monto', align: 'right' },
  ],
  observaciones: [
    { key: 'fecha', label: 'Fecha', formatter: celdaFecha },
    { key: 'texto', label: 'Observación' },
    { key: 'usuario', label: 'Usuario' },
  ],
}

const columnasActivas = computed<TableColumn[]>(
  () => COLUMNAS[resumenActivo.value?.coleccion ?? ''] ?? [],
)

async function exportar() {
  if (!libro.value) return
  await exportarLibroDiarioExcel(libro.value)
}
</script>
