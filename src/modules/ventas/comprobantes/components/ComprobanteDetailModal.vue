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
          <p class="text-xs text-gray-500 dark:text-gray-400">Tipo</p>
          <ListaOpcionBadge
            :value="comprobante.nombre_tipo_comprobante ?? comprobante.codigo_tipo_comprobante"
          />
        </div>
        <div>
          <p class="text-xs text-gray-500 dark:text-gray-400">Estado SUNAT</p>
          <ListaOpcionBadge
            :value="comprobante.nombre_estado_sunat ?? 'PENDIENTE'"
            raw
          />
        </div>
        <div>
          <p class="text-xs text-gray-500 dark:text-gray-400">Reparto</p>
          <AppBadge
            v-if="tieneRepartoVigente"
            size="sm"
            :color="esActividadRealizada(comprobante.nombre_estado_actividad) ? 'success' : 'primary'"
            :icon="ICONS.truck"
          >
            {{ esTipoRepartoNombre(comprobante.nombre_tipo_actividad) ? 'Reparto' : 'Actividad' }}
            <span v-if="comprobante.nombre_estado_actividad">
              · {{ formatListaOpcionLabel(comprobante.nombre_estado_actividad) }}
            </span>
          </AppBadge>
          <span v-else class="text-sm text-gray-500 dark:text-gray-400">Sin reparto</span>
          <p
            v-if="tieneRepartoVigente && comprobante.nombre_chofer_responsable"
            class="mt-1 text-xs text-gray-500 dark:text-gray-400"
          >
            Chofer: {{ comprobante.nombre_chofer_responsable }}
          </p>
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
        v-if="comprobante.glosa || comprobante.observaciones"
        class="rounded-xl border border-gray-200 p-4 dark:border-gray-800"
      >
        <h5 class="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
          Observaciones
        </h5>
        <p
          v-if="comprobante.glosa"
          class="text-sm text-gray-700 dark:text-gray-300"
        >
          {{ comprobante.glosa }}
        </p>
        <p
          v-if="comprobante.observaciones"
          class="mt-1 text-sm text-gray-700 dark:text-gray-300"
        >
          {{ comprobante.observaciones }}
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
      <button
        v-if="puedeGenerarGuia"
        type="button"
        class="inline-flex items-center justify-center gap-1.5 rounded-lg border border-brand-500 bg-white px-4 py-2.5 text-sm font-medium text-brand-600 hover:bg-brand-500/10 dark:bg-gray-800 dark:text-brand-400"
        @click="generarGuiaRemision"
      >
        <AppIcon :name="ICONS.fileText" :size="16" />
        Generar guía de remisión
      </button>
      <button
        v-if="puedeAgregarReparto"
        type="button"
        class="inline-flex items-center justify-center gap-1.5 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600"
        @click="emit('agregar-reparto', comprobante!)"
      >
        <AppIcon :name="ICONS.truck" :size="16" />
        Agregar a reparto
      </button>
      <button
        v-else-if="puedeCancelarReparto"
        type="button"
        class="inline-flex items-center justify-center gap-1.5 rounded-lg border border-error-300 bg-white px-4 py-2.5 text-sm font-medium text-error-600 hover:bg-error-50 disabled:opacity-70 dark:border-error-500/40 dark:bg-gray-800 dark:text-error-400"
        :disabled="cancelarMutation.isPending.value"
        @click="cancelarReparto"
      >
        <AppIcon :name="ICONS.ban" :size="16" />
        {{ cancelarMutation.isPending.value ? 'Cancelando...' : 'Cancelar reparto' }}
      </button>
    </template>
  </AppModal>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { useCancelarActividadMutation } from '@/modules/operativa/actividades/composables/useActividadMutations'
import {
  esActividadRealizada,
  esTipoRepartoNombre,
  tieneActividadVigente,
} from '@/modules/operativa/actividades/utils/actividadTipo'
import { useComprobanteQuery } from '@/modules/ventas/comprobantes/composables/useComprobantesQuery'
import { comprobantesService } from '@/modules/ventas/comprobantes/services/comprobantes.service'
import type { Comprobante } from '@/modules/ventas/comprobantes/interfaces/comprobante.interface'
import {
  downloadBlob,
  openPdfPrintWindow,
  printBlobInWindow,
  type ComprobantePdfFormato,
} from '@/modules/ventas/comprobantes/utils/comprobantePdf'
import { useCrearDesdeVentaMutation } from '@/modules/documentos-salida/composables/useDocumentoSalidaMutations'
import { AppBadge, AppModal, ListaOpcionBadge } from '@/shared/components'
import AppIcon from '@/shared/components/AppIcon.vue'
import { ICONS } from '@/shared/constants/icons'
import { PermisoBanderas } from '@/shared/constants/permissions'
import { toastApiError, toastSuccess, toastWarning } from '@/shared/composables/useToast'
import { formatListaOpcionLabel } from '@/shared/utils/formatListaOpcion'

const props = defineProps<{
  modelValue: boolean
  comprobanteId: number | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'agregar-reparto': [comprobante: Comprobante]
}>()

const router = useRouter()
const authStore = useAuthStore()
const cancelarMutation = useCancelarActividadMutation()
const canCrearActividad = computed(() =>
  authStore.hasPermission(PermisoBanderas.ACTIVIDADES_CREAR),
)
const canEditarActividad = computed(() =>
  authStore.hasPermission(PermisoBanderas.ACTIVIDADES_EDITAR),
)
const canCrearGre = computed(() =>
  authStore.hasPermission(PermisoBanderas.DOCUMENTOS_SALIDA_CREAR),
)
const crearDesdeVentaMutation = useCrearDesdeVentaMutation()

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
const tieneRepartoVigente = computed(() => tieneActividadVigente(comprobante.value))
const puedeAgregarReparto = computed(
  () => canCrearActividad.value && Boolean(comprobante.value) && !tieneRepartoVigente.value,
)
const puedeCancelarReparto = computed(
  () =>
    canEditarActividad.value &&
    tieneRepartoVigente.value &&
    !esActividadRealizada(comprobante.value?.nombre_estado_actividad) &&
    Boolean(comprobante.value?.id_actividad),
)

const puedeGenerarGuia = computed(
  () => canCrearGre.value && Boolean(comprobante.value?.id_cliente),
)

const puedePdf = computed(() => {
  const estado = comprobante.value?.nombre_estado_sunat?.toUpperCase()
  return estado === 'ACEPTADO' || Boolean(comprobante.value?.hash_documento)
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

async function cancelarReparto() {
  const id = comprobante.value?.id_actividad
  const userId = authStore.user?.id
  if (!id || !userId) return
  if (
    !window.confirm(
      '¿Cancelar el reparto de este comprobante? Quedará disponible para programar otro.',
    )
  ) {
    return
  }
  try {
    await cancelarMutation.mutateAsync({ id, idUsuarioAuditoria: userId })
  } catch {
    // toast en mutation
  }
}

async function generarGuiaRemision() {
  const c = comprobante.value
  if (!c) return
  if (!c.id_cliente) {
    toastWarning('El comprobante no tiene cliente para generar la orden de salida.')
    return
  }
  const doc = await crearDesdeVentaMutation.mutateAsync({
    idVenta: c.id,
    idUsuarioAuditoria: authStore.user?.id,
  })
  open.value = false
  void router.push({ name: 'admin-documentos-salida-editar', params: { id: doc.id }, query: { direccion: '1' } })
}

function handleClose() {
  open.value = false
}
</script>