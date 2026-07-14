<template>
  <AppModal
    v-model="open"
    title="Nota de crédito"
    :subtitle="comprobanteLabel"
    size="xl"
  >
    <div class="space-y-4">
      <DetailSectionCard title="Información" :icon="ICONS.alertCircle" :full-width="true">
        <div
          class="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-200"
        >
          Se creará una nota de crédito (07) referida a este comprobante.
          Para boletas es el medio correcto de anulación/ajuste; para facturas también puede usarse
          en lugar de la comunicación de baja cuando corresponda.
        </div>
      </DetailSectionCard>

      <DetailCardsLayout :loading="origenQuery.isLoading.value" :sections="sections">
        <template #badges>
          <ListaOpcionBadge
            v-if="comprobante?.nombre_tipo_comprobante || comprobante?.codigo_tipo_comprobante"
            :value="comprobante.nombre_tipo_comprobante ?? comprobante.codigo_tipo_comprobante"
          />
          <ListaOpcionBadge
            v-if="comprobante?.nombre_estado_sunat"
            :value="comprobante.nombre_estado_sunat"
            raw
          />
        </template>
      </DetailCardsLayout>

      <DetailSectionCard title="Nota de crédito" :icon="ICONS.fileText" :full-width="true">
        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <AppSelect
            v-model="idMotivoNota"
            label="Motivo SUNAT"
            :options="motivoOptions"
            placeholder="Seleccionar motivo"
            :disabled="saving"
            required
          />
          <AppInput
            v-model="serie"
            label="Serie NC"
            placeholder="BC01 / FC01"
            :disabled="saving"
            required
          />
          <AppInput
            v-model="fecha"
            label="Fecha"
            type="date"
            :disabled="saving"
            required
          />
          <label class="flex items-end gap-2 pb-2 text-sm text-gray-700 dark:text-gray-300">
            <input v-model="emitirTrasCrear" type="checkbox" class="rounded border-gray-300" :disabled="saving" />
            Emitir a SUNAT al crear
          </label>
        </div>
      </DetailSectionCard>

      <DetailSectionCard title="Detalle a acreditar" :icon="ICONS.clipboardList" :full-width="true">
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
                v-for="(linea, index) in lineas"
                :key="linea.key"
                class="border-t border-gray-100 dark:border-gray-800"
              >
                <td class="px-3 py-2">{{ linea.descripcion }}</td>
                <td class="px-3 py-2 text-right">
                  <input
                    v-model.number="linea.cantidad"
                    type="number"
                    min="0.001"
                    step="0.001"
                    class="w-24 rounded-lg border border-gray-300 bg-transparent px-2 py-1 text-right tabular-nums dark:border-gray-700"
                    :disabled="saving"
                  />
                </td>
                <td class="px-3 py-2 text-right tabular-nums">
                  {{ formatMoney(linea.precioUnitario) }}
                </td>
                <td class="px-3 py-2 text-right tabular-nums">
                  {{ formatMoney(linea.cantidad * linea.precioUnitario) }}
                  <button
                    v-if="lineas.length > 1"
                    type="button"
                    class="ml-2 text-error-500 hover:underline"
                    :disabled="saving"
                    @click="lineas.splice(index, 1)"
                  >
                    Quitar
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p class="mt-3 text-right text-sm font-semibold text-gray-800 dark:text-white/90">
          Total NC: {{ formatMoney(totalEstimado) }}
        </p>
      </DetailSectionCard>
    </div>

    <template #footer>
      <button
        type="button"
        class="inline-flex items-center justify-center gap-1.5 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
        :disabled="saving"
        @click="open = false"
      >
        Cancelar
      </button>
      <button
        type="button"
        class="inline-flex items-center justify-center gap-1.5 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-70"
        :disabled="saving || !canSave"
        @click="confirm"
      >
        <AppIcon v-if="!saving" :name="ICONS.fileText" :size="16" />
        <AppIcon v-else :name="ICONS.refreshCw" :size="16" class="animate-spin" />
        {{ saving ? 'Procesando...' : emitirTrasCrear ? 'Crear y emitir NC' : 'Crear NC' }}
      </button>
    </template>
  </AppModal>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useComprobanteCatalogosPosQuery, useComprobanteQuery } from '@/modules/ventas/comprobantes/composables/useComprobantesQuery'
import {
  useCreateComprobanteMutation,
  useEmitirComprobanteMutation,
} from '@/modules/ventas/comprobantes/composables/useComprobanteMutations'
import type { ComprobanteListItem } from '@/modules/ventas/comprobantes/interfaces/comprobante.interface'
import { seriePorDefectoDesdeCodigo, validarSerieParaTipo } from '@/modules/ventas/comprobantes/utils/serieComprobante'
import { toSelectOptions } from '@/modules/catalogos/utils/toSelectOptions'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import DetailCardsLayout from '@/shared/components/detail/DetailCardsLayout.vue'
import DetailSectionCard from '@/shared/components/detail/DetailSectionCard.vue'
import type { DetailSection } from '@/shared/components/detail/detail.types'
import { AppInput, AppModal, AppSelect, ListaOpcionBadge } from '@/shared/components'
import AppIcon from '@/shared/components/AppIcon.vue'
import { toastApiError, toastWarning } from '@/shared/composables/useToast'
import { ICONS } from '@/shared/constants/icons'

interface LineaNc {
  key: string
  idProducto: number
  descripcion: string
  cantidad: number
  precioUnitario: number
  descuento: number
  porcentajeIgv: number
  idAfectacionIgv?: number
}

const props = defineProps<{
  modelValue: boolean
  comprobante: ComprobanteListItem | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const authStore = useAuthStore()
const createMutation = useCreateComprobanteMutation()
const emitirMutation = useEmitirComprobanteMutation()
const catalogosQuery = useComprobanteCatalogosPosQuery()

const origenId = computed(() => (props.modelValue ? props.comprobante?.id ?? null : null))
const origenQuery = useComprobanteQuery(origenId)

const idMotivoNota = ref<number | ''>('')
const serie = ref('')
const fecha = ref(new Date().toISOString().slice(0, 10))
const emitirTrasCrear = ref(true)
const lineas = ref<LineaNc[]>([])

const open = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value),
})

const comprobanteLabel = computed(() => {
  if (!props.comprobante) return undefined
  return `${props.comprobante.serie}-${props.comprobante.numero}`
})

const motivoOptions = computed(() =>
  toSelectOptions(catalogosQuery.data.value?.motivosNotaCredito ?? []),
)

const idTipoNotaCredito = computed(() => {
  const tipos = catalogosQuery.data.value?.tiposComprobante ?? []
  const found = tipos.find(
    (t) =>
      t.descripcion === '07' ||
      t.nombre.toUpperCase().includes('NOTA_CREDITO') ||
      t.nombre.toUpperCase().includes('NOTA CREDITO'),
  )
  return found?.id ?? null
})

const sections = computed<DetailSection[]>(() => {
  const row = props.comprobante
  if (!row) return []
  return [
    {
      title: 'Comprobante origen',
      icon: ICONS.receipt,
      fullWidth: true,
      items: [
        { label: 'Número', value: `${row.serie}-${row.numero}` },
        {
          label: 'Tipo',
          value: row.nombre_tipo_comprobante ?? row.codigo_tipo_comprobante ?? '—',
        },
        { label: 'Cliente', value: row.nombre_cliente ?? '—' },
        { label: 'Fecha', value: row.fecha ?? '—' },
        {
          label: 'Total',
          value: formatMoney(Number(row.total_importe ?? 0)),
        },
      ],
    },
  ]
})

const totalEstimado = computed(() =>
  lineas.value.reduce((acc, linea) => acc + Number(linea.cantidad) * Number(linea.precioUnitario), 0),
)

const saving = computed(
  () => createMutation.isPending.value || emitirMutation.isPending.value,
)

const canSave = computed(
  () =>
    Boolean(idMotivoNota.value) &&
    Boolean(serie.value.trim()) &&
    Boolean(fecha.value) &&
    Boolean(idTipoNotaCredito.value) &&
    lineas.value.length > 0 &&
    lineas.value.every((l) => l.cantidad > 0),
)

watch(
  () => props.modelValue,
  (isOpen) => {
    if (!isOpen) return
    idMotivoNota.value = ''
    fecha.value = new Date().toISOString().slice(0, 10)
    emitirTrasCrear.value = true
    serie.value = seriePorDefectoDesdeCodigo('07', '', props.comprobante?.serie)
  },
)

watch(
  () => origenQuery.data.value,
  (data) => {
    if (!data) return
    lineas.value = (data.detalles ?? []).map((detalle, index) => ({
      key: `${detalle.id ?? detalle.id_producto}-${index}`,
      idProducto: detalle.id_producto,
      descripcion:
        detalle.descripcion || detalle.nombre_producto || `Producto ${detalle.id_producto}`,
      cantidad: Number(detalle.cantidad),
      precioUnitario: Number(detalle.precio_unitario),
      descuento: Number(detalle.descuento ?? 0),
      porcentajeIgv: Number(detalle.porcentaje_igv ?? 18),
      idAfectacionIgv: detalle.id_afectacion_igv ?? undefined,
    }))
  },
)

function formatMoney(value: number) {
  return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(value)
}

async function confirm() {
  const row = props.comprobante
  const origen = origenQuery.data.value
  const userId = authStore.user?.id
  const tipoNc = idTipoNotaCredito.value

  if (!row || !origen || !userId || !tipoNc || !canSave.value) return

  const serieError = validarSerieParaTipo('07', serie.value, row.serie)
  if (serieError) {
    toastWarning(serieError)
    return
  }

  try {
    const creado = await createMutation.mutateAsync({
      idUsuarioAuditoria: userId,
      idTipoComprobante: tipoNc,
      serie: serie.value.trim().toUpperCase(),
      fecha: fecha.value,
      idCliente: origen.id_cliente,
      idComprobanteOrigen: row.id,
      idMotivoNota: Number(idMotivoNota.value),
      idMoneda: origen.id_moneda ?? undefined,
      idMedioPago: origen.id_medio_pago ?? undefined,
      idAlmacen: origen.id_almacen ?? undefined,
      idTipoOperacionSunat: origen.id_tipo_operacion_sunat ?? undefined,
      glosa: `NC de ${row.serie}-${row.numero}`,
      detalles: lineas.value.map((linea) => ({
        idProducto: linea.idProducto,
        cantidad: Number(linea.cantidad),
        precioUnitario: Number(linea.precioUnitario),
        descuento: linea.descuento || undefined,
        porcentajeIgv: linea.porcentajeIgv,
        idAfectacionIgv: linea.idAfectacionIgv,
        descripcion: linea.descripcion,
      })),
    })

    if (emitirTrasCrear.value && creado?.id) {
      await emitirMutation.mutateAsync({
        id: creado.id,
        idUsuarioAuditoria: userId,
      })
    }

    open.value = false
  } catch (error) {
    if (!createMutation.isError.value && !emitirMutation.isError.value) {
      toastApiError(error, 'No se pudo crear la nota de crédito')
    }
  }
}
</script>
