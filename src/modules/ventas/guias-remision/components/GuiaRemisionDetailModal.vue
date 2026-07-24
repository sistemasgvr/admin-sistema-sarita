<template>
  <AppModal v-model="open" title="Detalle de guía de remisión" size="xl" @close="handleClose">
    <div
      v-if="guiaQuery.isLoading.value"
      class="py-8 text-center text-sm text-gray-500 dark:text-gray-400"
    >
      Cargando guía...
    </div>

    <div v-else-if="guia" class="space-y-4">
      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <p class="text-xs text-gray-500 dark:text-gray-400">Documento</p>
          <p class="font-medium text-gray-800 dark:text-white/90">
            {{ guia.serie }}-{{ guia.numero }}
          </p>
          <div class="mt-1">
            <ListaOpcionBadge :value="guia.nombre_tipo_guia ?? guia.codigo_tipo_guia" />
          </div>
        </div>
        <div>
          <p class="text-xs text-gray-500 dark:text-gray-400">Destinatario</p>
          <p class="font-medium text-gray-800 dark:text-white/90">
            {{ guia.nombre_destinatario ?? '—' }}
          </p>
          <p class="text-xs text-gray-500">{{ guia.documento_destinatario }}</p>
        </div>
        <div>
          <p class="text-xs text-gray-500 dark:text-gray-400">Estado SUNAT</p>
          <ListaOpcionBadge :value="guia.nombre_estado_sunat ?? 'PENDIENTE'" raw />
        </div>
        <div>
          <p class="text-xs text-gray-500 dark:text-gray-400">Fecha emisión</p>
          <p class="text-gray-700 dark:text-gray-300">{{ guia.fecha }}</p>
        </div>
        <div>
          <p class="text-xs text-gray-500 dark:text-gray-400">Fecha traslado</p>
          <p class="text-gray-700 dark:text-gray-300">{{ guia.fecha_traslado ?? '—' }}</p>
        </div>
        <div>
          <p class="text-xs text-gray-500 dark:text-gray-400">Motivo</p>
          <p class="text-gray-700 dark:text-gray-300">
            {{ formatListaOpcionLabel(guia.nombre_motivo_traslado, guia.codigo_motivo_traslado) }}
          </p>
        </div>
        <div>
          <p class="text-xs text-gray-500 dark:text-gray-400">Modalidad</p>
          <p class="text-gray-700 dark:text-gray-300">
            {{
              formatListaOpcionLabel(
                guia.nombre_modalidad_traslado,
                guia.codigo_modalidad_traslado,
              )
            }}
          </p>
        </div>
        <div>
          <p class="text-xs text-gray-500 dark:text-gray-400">Peso / bultos</p>
          <p class="text-gray-700 dark:text-gray-300">
            {{ guia.peso_bruto ?? '—' }} kg · {{ guia.numero_bultos ?? '—' }} bultos
          </p>
        </div>
        <div>
          <p class="text-xs text-gray-500 dark:text-gray-400">Transporte</p>
          <p class="text-gray-700 dark:text-gray-300">
            {{
              guia.placa_vehiculo
                ? `${guia.placa_vehiculo} · ${guia.nombre_chofer ?? '—'}`
                : (guia.nombre_transportista ?? '—')
            }}
          </p>
        </div>
        <div class="sm:col-span-2">
          <p class="text-xs text-gray-500 dark:text-gray-400">Origen → Destino</p>
          <p class="text-gray-700 dark:text-gray-300">
            {{ guia.direccion_origen ?? '—' }} ({{ guia.ubigeo_origen ?? '—' }})
            →
            {{ guia.direccion_llegada ?? '—' }} ({{ guia.ubigeo_llegada ?? '—' }})
          </p>
        </div>
        <div v-if="guia.observaciones" class="sm:col-span-2">
          <p class="text-xs text-gray-500 dark:text-gray-400">Observaciones</p>
          <p class="text-gray-700 dark:text-gray-300">{{ guia.observaciones }}</p>
        </div>
      </div>

      <div class="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
        <table class="min-w-full text-sm">
          <thead class="bg-gray-50 dark:bg-white/5">
            <tr>
              <th class="px-3 py-2 text-left">#</th>
              <th class="px-3 py-2 text-left">Código</th>
              <th class="px-3 py-2 text-left">Descripción</th>
              <th class="px-3 py-2 text-right">Cant.</th>
              <th class="px-3 py-2 text-left">Und.</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="detalle in guia.detalles"
              :key="detalle.id ?? `${detalle.id_producto}-${detalle.item}`"
              class="border-t border-gray-100 dark:border-gray-800"
            >
              <td class="px-3 py-2">{{ detalle.item }}</td>
              <td class="px-3 py-2">
                {{ detalle.codigo_balon || detalle.codigo_producto || '—' }}
              </td>
              <td class="px-3 py-2">
                {{
                  detalle.glosa ||
                  detalle.descripcion ||
                  detalle.nombre_producto ||
                  detalle.id_producto
                }}
              </td>
              <td class="px-3 py-2 text-right tabular-nums">{{ detalle.cantidad }}</td>
              <td class="px-3 py-2">{{ detalle.nombre_unidad_medida ?? '—' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <template #footer>
      <button
        type="button"
        class="flex w-full justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 sm:w-auto"
        :disabled="downloadingPdf"
        @click="handleClose"
      >
        Cerrar
      </button>
      <button
        v-if="guia"
        type="button"
        class="flex w-full justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-70 sm:w-auto"
        :disabled="downloadingPdf"
        @click="descargarPdf"
      >
        {{ downloadingPdf ? 'Generando...' : 'Descargar PDF' }}
      </button>
    </template>
  </AppModal>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { downloadBlob } from '@/modules/ventas/comprobantes/utils/comprobantePdf'
import { useGuiaRemisionQuery } from '@/modules/ventas/guias-remision/composables/useGuiasRemisionQuery'
import { guiasRemisionService } from '@/modules/ventas/guias-remision/services/guias-remision.service'
import { AppModal, ListaOpcionBadge } from '@/shared/components'
import { toastApiError, toastSuccess } from '@/shared/composables/useToast'
import { formatListaOpcionLabel } from '@/shared/utils/formatListaOpcion'

const props = defineProps<{
  guiaId: number | null
}>()

const open = defineModel<boolean>({ default: false })
const downloadingPdf = ref(false)

const idRef = computed(() => (open.value ? props.guiaId : null))
const guiaQuery = useGuiaRemisionQuery(idRef)
const guia = computed(() => guiaQuery.data.value ?? null)

function handleClose() {
  open.value = false
}

async function descargarPdf() {
  const current = guia.value
  if (!current) return
  downloadingPdf.value = true
  try {
    const blob = await guiasRemisionService.obtenerPdf(current.id)
    downloadBlob(blob, `GRE-${current.serie}-${current.numero}.pdf`)
    toastSuccess('PDF descargado')
  } catch (error) {
    toastApiError(error, 'No se pudo generar el PDF')
  } finally {
    downloadingPdf.value = false
  }
}
</script>
