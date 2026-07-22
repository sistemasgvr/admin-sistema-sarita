<template>
  <AppModal v-model="open" :title="modalTitle" :subtitle="comprobanteLabel" size="xl">
    <div class="space-y-4">
      <DetailSectionCard title="Información" :icon="ICONS.alertCircle" :full-width="true">
        <div
          class="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-200"
        >
          Se creará {{ esFactura ? 'una Factura (01)' : 'una Boleta (03)' }} a partir de esta nota de
          venta. La NV quedará registrada como comprobante origen del nuevo documento electrónico.
        </div>
      </DetailSectionCard>

      <DetailCardsLayout :loading="origenQuery.isLoading.value" :sections="sections">
        <template #badges>
          <ListaOpcionBadge
            v-if="comprobante?.nombre_tipo_comprobante || comprobante?.codigo_tipo_comprobante"
            :value="comprobante.nombre_tipo_comprobante ?? comprobante.codigo_tipo_comprobante"
          />
        </template>
      </DetailCardsLayout>

      <DetailSectionCard title="Documento a emitir" :icon="ICONS.fileText" :full-width="true">
        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <AppInput
            v-model="serie"
            label="Serie"
            :placeholder="esFactura ? 'F001' : 'B001'"
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

      <DetailSectionCard title="Detalle" :icon="ICONS.clipboardList" :full-width="true">
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
                v-for="linea in lineas"
                :key="linea.key"
                class="border-t border-gray-100 dark:border-gray-800"
              >
                <td class="px-3 py-2">{{ linea.descripcion }}</td>
                <td class="px-3 py-2 text-right tabular-nums">
                  {{ linea.cantidad }}
                </td>
                <td class="px-3 py-2 text-right tabular-nums">
                  {{ formatMoney(linea.precioUnitario) }}
                </td>
                <td class="px-3 py-2 text-right tabular-nums">
                  {{ formatMoney(linea.cantidad * linea.precioUnitario) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p class="mt-3 text-right text-sm font-semibold text-gray-800 dark:text-white/90">
          Total: {{ formatMoney(totalEstimado) }}
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
        {{ saving ? 'Procesando...' : emitirTrasCrear ? 'Crear y emitir' : 'Crear comprobante' }}
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
import { type CodigoTipoComprobanteSunat, seriePorDefectoDesdeCodigo, validarSerieParaTipo } from '@/modules/ventas/comprobantes/utils/serieComprobante'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import DetailCardsLayout from '@/shared/components/detail/DetailCardsLayout.vue'
import DetailSectionCard from '@/shared/components/detail/DetailSectionCard.vue'
import type { DetailSection } from '@/shared/components/detail/detail.types'
import { AppInput, AppModal, ListaOpcionBadge } from '@/shared/components'
import AppIcon from '@/shared/components/AppIcon.vue'
import { toastApiError, toastWarning } from '@/shared/composables/useToast'
import { ICONS } from '@/shared/constants/icons'

interface LineaItem {
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
  codigoTipo: CodigoTipoComprobanteSunat
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const authStore = useAuthStore()
const createMutation = useCreateComprobanteMutation()
const emitirMutation = useEmitirComprobanteMutation()
const catalogosQuery = useComprobanteCatalogosPosQuery()

const idTipoComprobante = computed(() => {
  const tipos = catalogosQuery.data.value?.tiposComprobante ?? []
  const found = tipos.find(
    (t) =>
      t.descripcion === props.codigoTipo ||
      t.nombre.toUpperCase().includes(props.codigoTipo === '01' ? 'FACTURA' : 'BOLETA'),
  )
  return found?.id ?? null
})

const origenId = computed(() => (props.modelValue ? props.comprobante?.id ?? null : null))
const origenQuery = useComprobanteQuery(origenId)

const serie = ref('')
const fecha = ref(new Date().toISOString().slice(0, 10))
const emitirTrasCrear = ref(true)
const lineas = ref<LineaItem[]>([])

const open = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value),
})

const esFactura = computed(() => props.codigoTipo === '01')

const codigoTipo = computed(() => props.codigoTipo)

const modalTitle = computed(() =>
  esFactura.value ? 'Emitir Factura' : 'Emitir Boleta',
)

const comprobanteLabel = computed(() => {
  if (!props.comprobante) return undefined
  return `${props.comprobante.serie}-${props.comprobante.numero}`
})

const sections = computed<DetailSection[]>(() => {
  const row = props.comprobante
  if (!row) return []
  return [
    {
      title: 'Nota de venta origen',
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
    Boolean(idTipoComprobante.value) &&
    Boolean(serie.value.trim()) &&
    Boolean(fecha.value) &&
    lineas.value.length > 0 &&
    lineas.value.every((l) => l.cantidad > 0),
)

watch(
  () => props.modelValue,
  (isOpen) => {
    if (!isOpen) return
    fecha.value = new Date().toISOString().slice(0, 10)
    emitirTrasCrear.value = true
    serie.value = seriePorDefectoDesdeCodigo(props.codigoTipo, '')
  },
)

watch(
  () => props.codigoTipo,
  () => {
    if (props.modelValue) {
      serie.value = seriePorDefectoDesdeCodigo(props.codigoTipo, '')
    }
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

  if (!row || !origen || !userId || !canSave.value) return

  const serieError = validarSerieParaTipo(codigoTipo.value, serie.value)
  if (serieError) {
    toastWarning(serieError)
    return
  }

  try {
    const creado = await createMutation.mutateAsync({
      idUsuarioAuditoria: userId,
      idTipoComprobante: idTipoComprobante.value!,
      serie: serie.value.trim().toUpperCase(),
      fecha: fecha.value,
      idCliente: origen.id_cliente,
      idComprobanteOrigen: row.id,
      idMoneda: origen.id_moneda ?? undefined,
      idMedioPago: origen.id_medio_pago ?? undefined,
      idAlmacen: origen.id_almacen ?? undefined,
      idTipoOperacionSunat: origen.id_tipo_operacion_sunat ?? undefined,
      glosa: `${esFactura.value ? 'Factura' : 'Boleta'} de NV ${row.serie}-${row.numero}`,
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
      toastApiError(error, 'No se pudo crear el comprobante')
    }
  }
}
</script>
