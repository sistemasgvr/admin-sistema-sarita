<template>
  <AppModal
    v-model="open"
    title="Detalle de comprobante"
    size="xl"
    @close="handleClose"
  >
    <div
      v-if="comprobanteQuery.isLoading.value"
      class="py-8 text-center text-sm text-gray-500 dark:text-gray-400"
    >
      Cargando comprobante...
    </div>

    <div v-else-if="comprobante" class="space-y-4">
      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <p class="text-xs text-gray-500 dark:text-gray-400">Comprobante</p>
          <p class="font-medium text-gray-800 dark:text-white/90">
            {{ comprobante.serie }}-{{ comprobante.numero }}
          </p>
        </div>
        <div>
          <p class="text-xs text-gray-500 dark:text-gray-400">Cliente</p>
          <p class="font-medium text-gray-800 dark:text-white/90">
            {{ comprobante.nombre_cliente ?? '—' }}
          </p>
        </div>
        <div>
          <p class="text-xs text-gray-500 dark:text-gray-400">Fecha</p>
          <p class="text-gray-700 dark:text-gray-300">{{ comprobante.fecha }}</p>
        </div>
        <div>
          <p class="text-xs text-gray-500 dark:text-gray-400">Estado SUNAT</p>
          <AppBadge variant="light" :color="sunatBadgeColor">
            {{ comprobante.nombre_estado_sunat ?? 'PENDIENTE' }}
          </AppBadge>
        </div>
      </div>

      <div class="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
        <table class="min-w-full text-sm">
          <thead class="bg-gray-50 dark:bg-white/5">
            <tr>
              <th class="px-3 py-2 text-left">Producto</th>
              <th class="px-3 py-2 text-right">Cant.</th>
              <th class="px-3 py-2 text-right">P. unit.</th>
              <th class="px-3 py-2 text-right">Importe</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="detalle in comprobante.detalles"
              :key="detalle.id ?? `${detalle.id_producto}-${detalle.item}`"
              class="border-t border-gray-100 dark:border-gray-800"
            >
              <td class="px-3 py-2">
                {{ detalle.descripcion || detalle.nombre_producto || detalle.id_producto }}
              </td>
              <td class="px-3 py-2 text-right tabular-nums">{{ detalle.cantidad }}</td>
              <td class="px-3 py-2 text-right tabular-nums">
                {{ formatMoney(Number(detalle.precio_unitario)) }}
              </td>
              <td class="px-3 py-2 text-right tabular-nums">
                {{ formatMoney(Number(detalle.importe ?? 0)) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="flex flex-col items-end gap-1 text-sm">
        <p>Valor venta: {{ formatMoney(Number(comprobante.valor_venta ?? 0)) }}</p>
        <p>IGV (18% incluido): {{ formatMoney(Number(comprobante.igv ?? 0)) }}</p>
        <p class="text-base font-semibold text-gray-800 dark:text-white/90">
          Total: {{ formatMoney(Number(comprobante.total_importe ?? 0)) }}
        </p>
      </div>

      <div
        v-if="puedePdf"
        class="rounded-xl border border-gray-200 p-3 dark:border-gray-800"
      >
        <p class="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
          Representación impresa
        </p>
        <div class="flex flex-wrap gap-2">
          <button
            type="button"
            class="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60 dark:border-gray-700 dark:text-gray-300"
            :disabled="pdfBusy"
            @click="descargarPdf('a4')"
          >
            <AppIcon :name="ICONS.download" :size="16" />
            PDF A4
          </button>
          <button
            type="button"
            class="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60 dark:border-gray-700 dark:text-gray-300"
            :disabled="pdfBusy"
            @click="imprimirPdf('a4')"
          >
            <AppIcon :name="ICONS.printer" :size="16" />
            Imprimir A4
          </button>
          <button
            type="button"
            class="inline-flex items-center gap-1.5 rounded-lg border border-brand-500 px-3 py-2 text-sm font-medium text-brand-600 hover:bg-brand-500/10 disabled:opacity-60"
            :disabled="pdfBusy"
            @click="descargarPdf('ticket')"
          >
            <AppIcon :name="ICONS.download" :size="16" />
            Ticketera 80mm
          </button>
          <button
            type="button"
            class="inline-flex items-center gap-1.5 rounded-lg border border-brand-500 px-3 py-2 text-sm font-medium text-brand-600 hover:bg-brand-500/10 disabled:opacity-60"
            :disabled="pdfBusy"
            @click="imprimirPdf('ticket')"
          >
            <AppIcon :name="ICONS.printer" :size="16" />
            Imprimir ticket 80mm
          </button>
        </div>
        <p v-if="pdfBusy" class="mt-2 text-xs text-gray-500">Generando PDF...</p>
      </div>
    </div>

    <template #footer>
      <button
        type="button"
        class="inline-flex justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
        @click="handleClose"
      >
        Cerrar
      </button>
    </template>
  </AppModal>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useComprobanteQuery } from '@/modules/ventas/comprobantes/composables/useComprobantesQuery'
import { comprobantesService } from '@/modules/ventas/comprobantes/services/comprobantes.service'
import {
  downloadBlob,
  openPdfPrintWindow,
  printBlobInWindow,
  type ComprobantePdfFormato,
} from '@/modules/ventas/comprobantes/utils/comprobantePdf'
import { AppBadge, AppModal } from '@/shared/components'
import AppIcon from '@/shared/components/AppIcon.vue'
import { ICONS } from '@/shared/constants/icons'
import { toastApiError, toastSuccess, toastWarning } from '@/shared/composables/useToast'

const props = defineProps<{
  modelValue: boolean
  comprobanteId: number | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const open = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value),
})

const comprobanteIdRef = ref<number | null>(null)
const comprobanteQuery = useComprobanteQuery(comprobanteIdRef)
const pdfBusy = ref(false)

watch(
  () => props.comprobanteId,
  (id) => {
    comprobanteIdRef.value = open.value ? id : null
  },
  { immediate: true },
)

watch(open, (isOpen) => {
  comprobanteIdRef.value = isOpen ? props.comprobanteId : null
})

const comprobante = computed(() => comprobanteQuery.data.value)

const puedePdf = computed(() => {
  const estado = comprobante.value?.nombre_estado_sunat?.toUpperCase()
  return estado === 'ACEPTADO' || Boolean(comprobante.value?.hash_documento)
})

const sunatBadgeColor = computed(() => {
  const estado = comprobante.value?.nombre_estado_sunat?.toUpperCase()
  if (estado === 'ACEPTADO') return 'success'
  if (estado === 'RECHAZADO') return 'error'
  return 'warning'
})

const formatMoney = (value: number) =>
  new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(value)

async function descargarPdf(formato: ComprobantePdfFormato) {
  pdfBusy.value = true
  try {
    const c = comprobante.value
    if (!c) throw new Error('Comprobante inválido')

    const blob = await comprobantesService.obtenerPdf(c.id, formato)
    downloadBlob(blob, `${c.serie}-${c.numero}-${formato}.pdf`)
    toastSuccess(formato === 'ticket' ? 'PDF ticketera 80mm descargado' : 'PDF A4 descargado')
  } catch (error) {
    toastApiError(error, 'No se pudo generar el documento')
  } finally {
    pdfBusy.value = false
  }
}

async function imprimirPdf(formato: ComprobantePdfFormato) {
  pdfBusy.value = true
  const win = openPdfPrintWindow()
  if (!win) {
    pdfBusy.value = false
    toastWarning(
      'El navegador bloqueó la ventana de impresión. Permite ventanas emergentes en la URL.',
    )
    return
  }

  try {
    const id = props.comprobanteId
    if (!id) throw new Error('Comprobante inválido')
    const blob = await comprobantesService.obtenerPdf(id, formato)
    printBlobInWindow(win, blob)
  } catch (error) {
    win.close()
    toastApiError(error, 'No se pudo abrir para imprimir')
  } finally {
    pdfBusy.value = false
  }
}

function handleClose() {
  open.value = false
}

</script>
