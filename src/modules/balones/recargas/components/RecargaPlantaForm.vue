<template>
  <div>
    <div
      v-if="isLoadingRecarga"
      class="rounded-2xl border border-gray-200 bg-white px-4 py-10 text-center text-sm text-gray-500 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-400"
    >
      Cargando orden...
    </div>

    <form
      v-else
      id="recarga-planta-form"
      class="space-y-5"
      autocomplete="off"
      @submit="onSubmit"
    >
      <FormCardsLayout>
        <DetailSectionCard
          v-if="mode === 'edit' && recargaDetalle"
          title="Orden"
          :icon="ICONS.clipboardList"
          :full-width="true"
        >
          <div class="flex flex-wrap items-center gap-3">
            <p class="text-sm font-medium text-gray-800 dark:text-white/90">
              {{ recargaDetalle.numero || `RP-${recargaDetalle.id}` }}
            </p>
            <AppBadge v-if="recargaDetalle.nombre_estado" color="warning">
              {{ recargaDetalle.nombre_estado }}
            </AppBadge>
            <span class="text-sm text-gray-500 dark:text-gray-400">
              {{ recargaDetalle.total_cilindros ?? detalles.length }} cilindro(s)
            </span>
          </div>
        </DetailSectionCard>

        <DetailSectionCard
          title="Salida a planta"
          :icon="ICONS.warehouse"
          help="Primero emite la GRE de vacíos. Luego registra esta orden (checklist) jalando esa guía. Confirmar salida genera el movimiento por cilindro."
        >
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <AppInput
              v-model="fechaSalida"
              label="Fecha salida"
              type="date"
              required
              v-bind="fechaSalidaAttrs"
              :disabled="isSubmitting || isSalidaLocked"
              :error="errors.fechaSalida"
            />

            <GuiaRemisionSelectField
              v-if="mode === 'create'"
              v-model="idGuiaSalida"
              v-model:search="guiaSalidaBuscar"
              label="GRE salida (vacíos)"
              placeholder="Selecciona guía de remisión"
              create-title="Nueva GRE de vacíos"
              origen="recarga-planta"
              :return-to="returnToNuevaOrden"
              return-id-param="idGuiaSalida"
              :loading="cargandoGuiaSalida"
              :disabled="isSubmitting"
              help="Autocompleta proveedor, almacén y cilindros. Usa + para emitir la GRE primero."
            />

            <ClienteSelectField
              v-model="idProveedor"
              label="Proveedor / planta"
              placeholder="Selecciona proveedor..."
              search-placeholder="Razón social, documento o código..."
              solo-proveedores
              :disabled="isSubmitting || isSalidaLocked"
              :error="errors.idProveedor"
              help="Solo proveedores (o cliente/proveedor). No lista clientes finales."
            />

            <AlmacenSelectField
              v-model="idAlmacen"
              :disabled="isSubmitting || isSalidaLocked"
              :error="errors.idAlmacen"
            />

            <AppInput
              v-model="serieGuiaSalida"
              label="Serie GRE salida"
              placeholder="T001"
              v-bind="serieGuiaSalidaAttrs"
              :disabled="isSubmitting || isSalidaLocked || Boolean(idGuiaSalida)"
              :error="errors.serieGuiaSalida"
            />

            <AppInput
              v-model="numeroGuiaSalida"
              label="Número GRE salida"
              placeholder="00000001"
              v-bind="numeroGuiaSalidaAttrs"
              :disabled="isSubmitting || isSalidaLocked || Boolean(idGuiaSalida)"
              :error="errors.numeroGuiaSalida"
            />

            <AppCheckbox
              v-if="mode === 'create'"
              v-model="confirmarSalida"
              label="Confirmar salida (registrar vacíos en stock)"
              :disabled="isSubmitting"
              class="sm:col-span-2"
            />
          </div>
        </DetailSectionCard>

        <DetailSectionCard
          title="Checklist de cilindros"
          :icon="ICONS.cylinder"
          :full-width="true"
          help="Detalle de la orden. Solo cilindros EMPRESA."
        >
          <div v-if="mode === 'create'" class="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end">
            <div class="min-w-0 flex-1">
              <PosBalonSelectField
                v-model="balonParaAgregar"
                mode="general"
                label="Agregar cilindro"
                placeholder="Vacío de empresa..."
                :extra-filters="balonExtraFilters"
                :disabled="isSubmitting"
              />
            </div>
            <button
              type="button"
              class="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
              :disabled="isSubmitting || !balonParaAgregar"
              @click="agregarBalonSeleccionado"
            >
              <AppIcon :name="ICONS.plus" :size="16" />
              Añadir
            </button>
          </div>

          <div
            v-if="detalles.length === 0"
            class="rounded-xl border border-dashed border-gray-300 px-4 py-8 text-center text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400"
          >
            Sin cilindros. Jalá una GRE o agregá manualmente.
          </div>

          <div v-else class="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
            <table class="min-w-full text-left text-sm">
              <thead class="bg-gray-50 text-xs uppercase text-gray-500 dark:bg-white/[0.03] dark:text-gray-400">
                <tr>
                  <th class="px-3 py-2 font-medium">Cilindro</th>
                  <th class="px-3 py-2 font-medium">Gas / producto</th>
                  <th class="px-3 py-2 font-medium">Capacidad</th>
                  <th class="px-3 py-2 font-medium">Estado</th>
                  <th class="px-3 py-2 font-medium">Contenido</th>
                  <th v-if="mode === 'create'" class="px-3 py-2 font-medium" />
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
                <tr
                  v-for="(linea, index) in detalles"
                  :key="`${linea.id_balon}-${index}`"
                  class="text-gray-800 dark:text-white/90"
                >
                  <td class="px-3 py-2.5 font-medium">
                    {{ linea.codigo_balon || `#${linea.id_balon}` }}
                  </td>
                  <td class="px-3 py-2.5">
                    {{ linea.nombre_producto || '—' }}
                  </td>
                  <td class="px-3 py-2.5 whitespace-nowrap">
                    <template v-if="linea.capacidad != null">
                      {{ linea.capacidad }}
                      {{ linea.nombre_unidad_medida || '' }}
                    </template>
                    <template v-else>—</template>
                  </td>
                  <td class="px-3 py-2.5">
                    <BalonEstadoBadge
                      v-if="linea.nombre_estado_balon"
                      :balon="{ nombre_estado_balon: linea.nombre_estado_balon }"
                      size="sm"
                    />
                    <span v-else class="text-gray-400">—</span>
                  </td>
                  <td class="px-3 py-2.5">
                    <BalonContenidoBadge
                      v-if="linea.nombre_estado_contenido"
                      :balon="{ nombre_estado_contenido: linea.nombre_estado_contenido }"
                      size="sm"
                    />
                    <span v-else class="text-gray-400">—</span>
                  </td>
                  <td v-if="mode === 'create'" class="px-3 py-2.5 text-right">
                    <button
                      type="button"
                      class="inline-flex h-8 w-8 items-center justify-center rounded-lg text-error-500 hover:bg-error-50 dark:hover:bg-error-500/10"
                      title="Quitar"
                      :disabled="isSubmitting"
                      @click="quitarDetalle(index)"
                    >
                      <AppIcon :name="ICONS.trash" :size="15" />
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p v-if="detalleError" class="mt-2 text-sm text-error-500">{{ detalleError }}</p>
        </DetailSectionCard>

        <DetailSectionCard
          v-if="mode === 'edit'"
          title="Retorno y compra"
          :icon="ICONS.calendar"
          help="Fecha de llegada = retorno físico (En almacén / Lleno). La compra es la factura de costo del proveedor (módulo Compras); se vincula aquí y no mueve stock de productos de gas. Cerrado solo con compra + retorno."
        >
          <div
            v-if="protocoloIncompleto"
            class="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200"
          >
            Esta orden tiene retorno registrado pero el protocolo está incompleto (lote, vencimiento
            y/o P.H.). Completa los campos abajo y guarda para regularizar el historial.
          </div>
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <GuiaRemisionSelectField
              v-model="idGuiaRetorno"
              v-model:search="guiaRetornoBuscar"
              label="GRE ingreso / retorno"
              placeholder="Opcional"
              create-title="Nueva GRE de retorno"
              origen="recarga-planta"
              :return-to="returnToEditarOrden"
              return-id-param="idGuiaRetorno"
              :disabled="isSubmitting"
            />

            <AppInput
              v-model="fechaLlegadaAlmacen"
              label="Fecha llegada almacén"
              type="date"
              v-bind="fechaLlegadaAlmacenAttrs"
              :disabled="isSubmitting"
              :error="errors.fechaLlegadaAlmacen"
            />

            <AppInput
              v-model="serieGuiaIngreso"
              label="Serie GRE ingreso"
              placeholder="T001"
              v-bind="serieGuiaIngresoAttrs"
              :disabled="isSubmitting || Boolean(idGuiaRetorno)"
            />

            <AppInput
              v-model="numeroGuiaIngreso"
              label="Número GRE ingreso"
              placeholder="00000002"
              v-bind="numeroGuiaIngresoAttrs"
              :disabled="isSubmitting || Boolean(idGuiaRetorno)"
            />

            <AppSelectSearch
              v-model="idComprobanteCompra"
              v-model:search="compraBuscar"
              remote
              clearable
              label="Comprobante de compra"
              placeholder="Vincular compra"
              search-placeholder="Serie, número o proveedor..."
              :options="compraOptions"
              :loading="comprasQuery.isFetching.value"
              :disabled="isSubmitting"
              help="Factura de costo en Compras (productos/gas/gastos). No crea stock de gas."
            />

            <AppInput
              v-model="serieFactura"
              label="Serie factura"
              placeholder="F001"
              v-bind="serieFacturaAttrs"
              :disabled="isSubmitting || Boolean(idComprobanteCompra)"
            />

            <AppInput
              v-model="numeroFactura"
              label="Número factura"
              placeholder="00000001"
              v-bind="numeroFacturaAttrs"
              :disabled="isSubmitting || Boolean(idComprobanteCompra)"
            />

            <AppInput
              v-model="lote"
              label="Nº lote"
              placeholder="Lote del proveedor / protocolo"
              help="Obligatorio con el retorno. Identifica el lote de llenado de la planta."
              v-bind="loteAttrs"
              :disabled="isSubmitting"
              :error="errors.lote"
            />

            <AppInput
              v-model="fechaVencimientoLote"
              label="Vencimiento lote"
              type="date"
              help="Obligatorio con el retorno."
              v-bind="fechaVencimientoLoteAttrs"
              :disabled="isSubmitting"
              :error="errors.fechaVencimientoLote"
            />

            <AppInput
              v-model="fechaPruebaHidrostatica"
              label="Prueba hidrostática (P.H.)"
              type="date"
              v-bind="fechaPruebaHidrostaticaAttrs"
              :disabled="isSubmitting"
              :error="errors.fechaPruebaHidrostatica"
              help="Obligatorio con el retorno. También se registra en el historial P.H. del cilindro."
            />
          </div>
        </DetailSectionCard>

        <DetailSectionCard title="Observación" :icon="ICONS.messageSquare" :full-width="true">
          <AppTextarea
            v-model="observacion"
            label="Observación"
            placeholder="Detalle adicional"
            :rows="3"
            v-bind="observacionAttrs"
            :disabled="isSubmitting"
            :error="errors.observacion"
          />
        </DetailSectionCard>
      </FormCardsLayout>

      <div class="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          class="flex w-full justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-white/[0.03] sm:w-auto"
          :disabled="isSubmitting || isLoadingRecarga"
          @click="emit('cancel')"
        >
          Cancelar
        </button>
        <button
          type="submit"
          class="flex w-full justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
          :disabled="isSubmitting || isLoadingRecarga"
        >
          {{
            isSubmitting
              ? 'Guardando...'
              : mode === 'create'
                ? confirmarSalida
                  ? 'Registrar salida de recarga'
                  : 'Guardar borrador'
                : 'Guardar cambios'
          }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/yup'
import * as yup from 'yup'
import { useListaOpcionesQuery } from '@/modules/catalogos/composables/useListaOpcionesQuery'
import AlmacenSelectField from '@/modules/configuracion/almacenes/components/AlmacenSelectField.vue'
import ClienteSelectField from '@/modules/clientes/components/ClienteSelectField.vue'
import BalonContenidoBadge from '@/modules/balones/components/BalonContenidoBadge.vue'
import BalonEstadoBadge from '@/modules/balones/components/BalonEstadoBadge.vue'
import { balonesService } from '@/modules/balones/cilindros/services/balones.service'
import {
  useCreateRecargaPlantaMutation,
  useUpdateRecargaPlantaMutation,
} from '@/modules/balones/recargas/composables/useRecargaPlantaMutations'
import { useRecargaPlantaQuery } from '@/modules/balones/recargas/composables/useRecargasPlantaQuery'
import type {
  RecargaPlantaDetalle,
  RecargaPlantaFormMode,
} from '@/modules/balones/recargas/interfaces/recarga-planta.interface'
import { useCompraQuery, useComprasQuery } from '@/modules/compras/composables/useComprasQuery'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import PosBalonSelectField from '@/modules/ventas/comprobantes/components/PosBalonSelectField.vue'
import GuiaRemisionSelectField from '@/modules/ventas/guias-remision/components/GuiaRemisionSelectField.vue'
import { useGuiaRemisionQuery } from '@/modules/ventas/guias-remision/composables/useGuiasRemisionQuery'
import {
  AppBadge,
  AppCheckbox,
  AppInput,
  AppSelectSearch,
  AppTextarea,
} from '@/shared/components'
import AppIcon from '@/shared/components/AppIcon.vue'
import DetailSectionCard from '@/shared/components/detail/DetailSectionCard.vue'
import FormCardsLayout from '@/shared/components/detail/FormCardsLayout.vue'
import { toastWarning } from '@/shared/composables/useToast'
import { ICONS } from '@/shared/constants/icons'
import { ListaIds } from '@/shared/constants/lista-ids'
import type { SelectOption } from '@/shared/interfaces/form.interface'
import { optionalString, requiredString } from '@/shared/validation'

interface RecargaPlantaFormProps {
  mode: RecargaPlantaFormMode
  recargaId?: number | null
  active?: boolean
  /** Prefill al volver de «Nueva GRE». */
  initialIdGuiaSalida?: number | null
  initialIdGuiaRetorno?: number | null
}

const props = withDefaults(defineProps<RecargaPlantaFormProps>(), {
  recargaId: null,
  active: true,
  initialIdGuiaSalida: null,
  initialIdGuiaRetorno: null,
})

const emit = defineEmits<{
  saved: []
  cancel: []
}>()

const authStore = useAuthStore()
const createMutation = useCreateRecargaPlantaMutation()
const updateMutation = useUpdateRecargaPlantaMutation()

const recargaIdRef = computed(() => (props.mode === 'edit' ? props.recargaId : null))
const recargaQuery = useRecargaPlantaQuery(recargaIdRef)
const isLoadingRecarga = computed(
  () => props.mode === 'edit' && props.active && recargaQuery.isFetching.value,
)
const recargaDetalle = computed(() => recargaQuery.data.value ?? null)

const isSalidaLocked = computed(() => {
  const estado = recargaDetalle.value?.nombre_estado
  return props.mode === 'edit' && estado != null && estado !== 'BORRADOR'
})

/** Órdenes históricas retornadas/cerradas sin lote/venc/P.H. */
const protocoloIncompleto = computed(() => {
  const data = recargaDetalle.value
  if (!data?.fecha_llegada_almacen) return false
  return !data.lote?.trim() || !data.fecha_vencimiento_lote || !data.fecha_prueba_hidrostatica
})

const detalles = ref<RecargaPlantaDetalle[]>([])
const detalleError = ref('')
const balonParaAgregar = ref<number | ''>('')
const confirmarSalida = ref(true)
const cargandoGuiaSalida = ref(false)

const idGuiaSalida = ref<number | ''>('')
const idGuiaRetorno = ref<number | ''>('')
const idComprobanteCompra = ref<number | ''>('')

const guiaSalidaBuscar = ref('')
const guiaRetornoBuscar = ref('')
const compraBuscar = ref('')

const comprasFilters = ref<{
  buscar: string
  pagina: number
  limite: number
  idProveedor?: number
  estado?: number
}>({ buscar: '', pagina: 1, limite: 30, estado: 1 })

let compraTimeout: ReturnType<typeof setTimeout> | undefined

function syncComprasFilters(buscar = compraBuscar.value.trim(), proveedorRaw?: string | number | '') {
  const proveedor =
    proveedorRaw !== '' && proveedorRaw != null ? Number(proveedorRaw) : undefined
  comprasFilters.value = {
    buscar,
    pagina: 1,
    limite: 30,
    estado: 1,
    idProveedor: Number.isFinite(proveedor) ? proveedor : undefined,
  }
}

watch(compraBuscar, (value) => {
  clearTimeout(compraTimeout)
  compraTimeout = setTimeout(() => {
    syncComprasFilters(value.trim(), idProveedor.value)
  }, 300)
})

const comprasQuery = useComprasQuery(comprasFilters)

const guiaSalidaIdRef = computed(() =>
  idGuiaSalida.value !== '' ? Number(idGuiaSalida.value) : null,
)
const guiaSalidaDetalleQuery = useGuiaRemisionQuery(guiaSalidaIdRef)

const guiaRetornoIdRef = computed(() =>
  idGuiaRetorno.value !== '' ? Number(idGuiaRetorno.value) : null,
)
const guiaRetornoDetalleQuery = useGuiaRemisionQuery(guiaRetornoIdRef)

const returnToNuevaOrden = '/admin/balones/recargas/planta/nueva'
const returnToEditarOrden = computed(() =>
  props.recargaId
    ? `/admin/balones/recargas/planta/${props.recargaId}/editar`
    : '/admin/balones/recargas/planta/nueva',
)

const compraSeleccionadaIdRef = computed(() =>
  idComprobanteCompra.value !== '' ? Number(idComprobanteCompra.value) : null,
)
const compraSeleccionadaQuery = useCompraQuery(compraSeleccionadaIdRef)

const toCompraOption = (compra: {
  id: number
  serie?: string | null
  numero?: string | null
  nombre_proveedor?: string | null
  proveedor?: string | null
}): SelectOption => {
  const doc = [compra.serie, compra.numero].filter(Boolean).join('-') || `Compra #${compra.id}`
  const proveedor = compra.nombre_proveedor ?? compra.proveedor
  return {
    value: compra.id,
    label: doc,
    title: proveedor ? `${doc} · ${proveedor}` : undefined,
  }
}

const compraOptions = computed<SelectOption[]>(() => {
  const opciones = new Map<string | number, SelectOption>()
  for (const compra of comprasQuery.data.value?.data ?? []) {
    opciones.set(compra.id, toCompraOption(compra))
  }
  const seleccionada = compraSeleccionadaQuery.data.value?.cabecera
  if (seleccionada) {
    opciones.set(seleccionada.id, toCompraOption(seleccionada))
  }
  return [...opciones.values()]
})

const listaPropietarioId = ref(ListaIds.PROPIETARIO_BALON)
const listaContenidoId = ref(ListaIds.ESTADO_CONTENIDO_BALON)
const propietarioQuery = useListaOpcionesQuery(listaPropietarioId)
const contenidoQuery = useListaOpcionesQuery(listaContenidoId)

const idPropietarioEmpresa = computed(
  () => propietarioQuery.data.value?.find((op) => op.nombre === 'EMPRESA')?.id,
)
const idContenidoVacio = computed(
  () => contenidoQuery.data.value?.find((op) => op.nombre === 'VACIO')?.id,
)

const balonExtraFilters = computed(() => ({
  idPropietario: idPropietarioEmpresa.value,
  idEstadoContenido: idContenidoVacio.value,
  soloBajas: false,
  idAlmacen: idAlmacen.value ? Number(idAlmacen.value) : undefined,
}))

const today = () => new Date().toISOString().slice(0, 10)
const toDateInput = (value?: string | null) => (value ? value.slice(0, 10) : '')

const optionalSelectNumber = () =>
  yup
    .mixed<string | number>()
    .transform((value) => (value === '' ? undefined : value))
    .optional()

const { defineField, handleSubmit, resetForm, errors, isSubmitting, setFieldValue } = useForm({
  validationSchema: toTypedSchema(
    yup.object({
      fechaSalida: requiredString('La fecha de salida'),
      idProveedor: optionalSelectNumber(),
      idAlmacen: optionalSelectNumber(),
      serieGuiaSalida: optionalString().max(10, 'Máximo 10 caracteres'),
      numeroGuiaSalida: optionalString().max(15, 'Máximo 15 caracteres'),
      serieGuiaIngreso: optionalString().max(10, 'Máximo 10 caracteres'),
      numeroGuiaIngreso: optionalString().max(15, 'Máximo 15 caracteres'),
      serieFactura: optionalString().max(10, 'Máximo 10 caracteres'),
      numeroFactura: optionalString().max(15, 'Máximo 15 caracteres'),
      fechaLlegadaAlmacen: optionalString(),
      lote: optionalString()
        .max(50, 'Máximo 50 caracteres')
        .test(
          'lote-requerido-retorno',
          'El número de lote es obligatorio al registrar el retorno',
          function (value) {
            const llegada = this.parent.fechaLlegadaAlmacen
            if (!llegada) return true
            return Boolean(value && String(value).trim())
          },
        ),
      fechaVencimientoLote: optionalString().test(
        'venc-lote-requerido-retorno',
        'El vencimiento del lote es obligatorio al registrar el retorno',
        function (value) {
          const llegada = this.parent.fechaLlegadaAlmacen
          if (!llegada) return true
          return Boolean(value && String(value).trim())
        },
      ),
      fechaPruebaHidrostatica: optionalString().test(
        'ph-requerido-retorno',
        'La fecha de P.H. es obligatoria al registrar el retorno',
        function (value) {
          const llegada = this.parent.fechaLlegadaAlmacen
          if (!llegada) return true
          return Boolean(value && String(value).trim())
        },
      ),
      observacion: optionalString().max(500, 'Máximo 500 caracteres'),
    }),
  ),
  initialValues: {
    fechaSalida: today(),
    idProveedor: '' as string | number,
    idAlmacen: '' as string | number,
    serieGuiaSalida: '',
    numeroGuiaSalida: '',
    serieGuiaIngreso: '',
    numeroGuiaIngreso: '',
    serieFactura: '',
    numeroFactura: '',
    fechaLlegadaAlmacen: '',
    lote: '',
    fechaVencimientoLote: '',
    fechaPruebaHidrostatica: '',
    observacion: '',
  },
})

const [fechaSalida, fechaSalidaAttrs] = defineField('fechaSalida')
const [idProveedor] = defineField('idProveedor')
const [idAlmacen] = defineField('idAlmacen')

watch(idProveedor, (value) => syncComprasFilters(compraBuscar.value.trim(), value))
const [serieGuiaSalida, serieGuiaSalidaAttrs] = defineField('serieGuiaSalida')
const [numeroGuiaSalida, numeroGuiaSalidaAttrs] = defineField('numeroGuiaSalida')
const [serieGuiaIngreso, serieGuiaIngresoAttrs] = defineField('serieGuiaIngreso')
const [numeroGuiaIngreso, numeroGuiaIngresoAttrs] = defineField('numeroGuiaIngreso')
const [serieFactura, serieFacturaAttrs] = defineField('serieFactura')
const [numeroFactura, numeroFacturaAttrs] = defineField('numeroFactura')
const [fechaLlegadaAlmacen, fechaLlegadaAlmacenAttrs] = defineField('fechaLlegadaAlmacen')
const [lote, loteAttrs] = defineField('lote')
const [fechaVencimientoLote, fechaVencimientoLoteAttrs] = defineField('fechaVencimientoLote')
const [fechaPruebaHidrostatica, fechaPruebaHidrostaticaAttrs] =
  defineField('fechaPruebaHidrostatica')
const [observacion, observacionAttrs] = defineField('observacion')

const toOptionalNumber = (value: string | number | undefined | null) =>
  value !== '' && value != null ? Number(value) : undefined

async function enriquecerLineasBalon(
  lineas: Array<{
    id_balon: number
    codigo_balon?: string | null
    id_producto?: number | null
    nombre_producto?: string | null
    codigo_producto?: string | null
    capacidad?: number | null
    id_unidad_medida?: number | null
    nombre_unidad_medida?: string | null
    nombre_estado_balon?: string | null
    nombre_estado_contenido?: string | null
    observacion?: string | null
  }>,
) {
  return Promise.all(
    lineas.map(async (linea) => {
      const completo =
        linea.capacidad != null &&
        linea.nombre_estado_balon &&
        linea.nombre_estado_contenido
      if (completo) return linea
      try {
        const balon = await balonesService.obtenerPorId(linea.id_balon)
        return {
          ...linea,
          codigo_balon: linea.codigo_balon ?? balon.codigo_balon ?? null,
          id_producto: linea.id_producto ?? balon.id_producto_gas ?? null,
          nombre_producto: linea.nombre_producto ?? balon.nombre_producto_gas ?? null,
          capacidad: linea.capacidad ?? balon.capacidad ?? null,
          nombre_unidad_medida: linea.nombre_unidad_medida ?? balon.nombre_unidad_medida ?? null,
          nombre_estado_balon: linea.nombre_estado_balon ?? balon.nombre_estado_balon ?? null,
          nombre_estado_contenido:
            linea.nombre_estado_contenido ?? balon.nombre_estado_contenido ?? null,
        }
      } catch {
        return linea
      }
    }),
  )
}

watch(
  () => guiaSalidaDetalleQuery.data.value,
  async (guia) => {
    if (props.mode !== 'create' || !guia || !idGuiaSalida.value) return

    cargandoGuiaSalida.value = false
    setFieldValue('serieGuiaSalida', guia.serie ?? '')
    setFieldValue('numeroGuiaSalida', guia.numero ?? '')
    if (guia.id_destinatario || guia.id_cliente) {
      setFieldValue('idProveedor', guia.id_destinatario ?? guia.id_cliente ?? '')
    }
    if (guia.id_almacen) {
      setFieldValue('idAlmacen', guia.id_almacen)
    }
    if (guia.fecha_traslado || guia.fecha) {
      setFieldValue('fechaSalida', toDateInput(guia.fecha_traslado || guia.fecha) || today())
    }

    const lineas = (guia.detalles ?? [])
      .filter((d) => d.id_balon != null && d.id_balon > 0)
      .map((d) => ({
        id_balon: Number(d.id_balon),
        codigo_balon: d.codigo_balon ?? null,
        id_producto: d.id_producto ?? null,
        nombre_producto: d.nombre_producto ?? null,
        codigo_producto: d.codigo_producto ?? null,
        capacidad: d.capacidad ?? d.capacidad_tipo_balon ?? null,
        id_unidad_medida: d.id_unidad_medida ?? null,
        nombre_unidad_medida: d.nombre_unidad_medida ?? null,
        nombre_estado_balon: d.nombre_estado_balon ?? null,
        nombre_estado_contenido: d.nombre_estado_contenido ?? null,
        observacion: d.glosa ?? null,
      }))

    if (lineas.length === 0) {
      toastWarning('La GRE no tiene líneas con cilindro (id_balon). Agregá manualmente.')
    } else {
      const enriquecidas = await enriquecerLineasBalon(lineas)
      const mapa = new Map(detalles.value.map((d) => [d.id_balon, d]))
      for (const linea of enriquecidas) {
        mapa.set(linea.id_balon, { ...mapa.get(linea.id_balon), ...linea })
      }
      detalles.value = Array.from(mapa.values())
      detalleError.value = ''
    }
  },
)

watch(idGuiaSalida, (value) => {
  if (props.mode !== 'create') return
  if (value === '' || value == null) return
  cargandoGuiaSalida.value = true
})

watch(
  () => guiaRetornoDetalleQuery.data.value,
  (guia) => {
    if (props.mode !== 'edit' || !guia || !idGuiaRetorno.value) return
    setFieldValue('serieGuiaIngreso', guia.serie ?? '')
    setFieldValue('numeroGuiaIngreso', guia.numero ?? '')
  },
)

watch(
  () => compraSeleccionadaQuery.data.value,
  (compra) => {
    if (props.mode !== 'edit' || !compra || !idComprobanteCompra.value) return
    setFieldValue('serieFactura', compra.cabecera.serie ?? '')
    setFieldValue('numeroFactura', compra.cabecera.numero ?? '')
  },
)

async function agregarBalonSeleccionado() {
  const id = balonParaAgregar.value !== '' ? Number(balonParaAgregar.value) : null
  if (!id) return

  if (detalles.value.some((d) => d.id_balon === id)) {
    toastWarning('Ese cilindro ya está en el checklist')
    balonParaAgregar.value = ''
    return
  }

  try {
    const balon = await balonesService.obtenerPorId(id)
    detalles.value.push({
      id_balon: balon.id,
      codigo_balon: balon.codigo_balon,
      id_producto: balon.id_producto_gas ?? null,
      nombre_producto: balon.nombre_producto_gas ?? null,
      capacidad: balon.capacidad ?? null,
      id_unidad_medida: null,
      nombre_unidad_medida: balon.nombre_unidad_medida ?? null,
      nombre_estado_balon: balon.nombre_estado_balon ?? null,
      nombre_estado_contenido: balon.nombre_estado_contenido ?? null,
    })
    detalleError.value = ''
    balonParaAgregar.value = ''
  } catch {
    toastWarning('No se pudo cargar el cilindro')
  }
}

function quitarDetalle(index: number) {
  detalles.value.splice(index, 1)
}

const syncFormValues = () => {
  const data = recargaDetalle.value
  if (!data) return

  resetForm({
    values: {
      fechaSalida: toDateInput(data.fecha_salida) || today(),
      idProveedor: data.id_proveedor ?? '',
      idAlmacen: data.id_almacen ?? '',
      serieGuiaSalida: data.serie_guia_salida ?? '',
      numeroGuiaSalida: data.numero_guia_salida ?? '',
      serieGuiaIngreso: data.serie_guia_ingreso ?? '',
      numeroGuiaIngreso: data.numero_guia_ingreso ?? '',
      serieFactura: data.serie_factura ?? '',
      numeroFactura: data.numero_factura ?? '',
      fechaLlegadaAlmacen: toDateInput(data.fecha_llegada_almacen),
      lote: data.lote ?? '',
      fechaVencimientoLote: toDateInput(data.fecha_vencimiento_lote),
      fechaPruebaHidrostatica: toDateInput(data.fecha_prueba_hidrostatica),
      observacion: data.observacion ?? '',
    },
  })

  idGuiaSalida.value = data.id_guia_salida ?? ''
  idGuiaRetorno.value = data.id_guia_retorno ?? ''
  idComprobanteCompra.value = data.id_comprobante_compra ?? ''
  detalles.value = [...(data.detalles ?? [])]
}

const resetCreateForm = () => {
  resetForm({
    values: {
      fechaSalida: today(),
      idProveedor: '',
      idAlmacen: '',
      serieGuiaSalida: '',
      numeroGuiaSalida: '',
      serieGuiaIngreso: '',
      numeroGuiaIngreso: '',
      serieFactura: '',
      numeroFactura: '',
      fechaLlegadaAlmacen: '',
      lote: '',
      fechaVencimientoLote: '',
      fechaPruebaHidrostatica: '',
      observacion: '',
    },
  })
  idGuiaSalida.value = ''
  idGuiaRetorno.value = ''
  idComprobanteCompra.value = ''
  detalles.value = []
  detalleError.value = ''
  confirmarSalida.value = true
  balonParaAgregar.value = ''
}

const onSubmit = handleSubmit(async (values) => {
  const currentUserId = authStore.user?.id
  if (!currentUserId) return

  if (props.mode === 'create') {
    if (detalles.value.length === 0) {
      detalleError.value = 'Debes indicar al menos un cilindro'
      return
    }

    try {
      await createMutation.mutateAsync({
        idUsuarioAuditoria: currentUserId,
        fechaSalida: values.fechaSalida,
        idProveedor: toOptionalNumber(values.idProveedor),
        idAlmacen: toOptionalNumber(values.idAlmacen),
        idGuiaSalida: toOptionalNumber(idGuiaSalida.value),
        serieGuiaSalida: values.serieGuiaSalida || undefined,
        numeroGuiaSalida: values.numeroGuiaSalida || undefined,
        observacion: values.observacion || undefined,
        confirmarSalida: confirmarSalida.value,
        detalles: detalles.value.map((d) => ({
          idBalon: d.id_balon,
          idProducto: d.id_producto ?? undefined,
          capacidad: d.capacidad ?? undefined,
          idUnidadMedida: d.id_unidad_medida ?? undefined,
          observacion: d.observacion ?? undefined,
        })),
      })
      emit('saved')
    } catch {
      // toast en mutation
    }
    return
  }

  if (!props.recargaId) return

  try {
    await updateMutation.mutateAsync({
      id: props.recargaId,
      payload: {
        idUsuarioAuditoria: currentUserId,
        fechaSalida: isSalidaLocked.value ? undefined : values.fechaSalida,
        idProveedor: isSalidaLocked.value
          ? undefined
          : toOptionalNumber(values.idProveedor),
        idAlmacen: isSalidaLocked.value ? undefined : toOptionalNumber(values.idAlmacen),
        idGuiaRetorno: toOptionalNumber(idGuiaRetorno.value),
        serieGuiaIngreso: values.serieGuiaIngreso || undefined,
        numeroGuiaIngreso: values.numeroGuiaIngreso || undefined,
        idComprobanteCompra: toOptionalNumber(idComprobanteCompra.value),
        serieFactura: values.serieFactura ?? '',
        numeroFactura: values.numeroFactura ?? '',
        fechaLlegadaAlmacen: values.fechaLlegadaAlmacen || undefined,
        lote: values.lote ?? '',
        fechaVencimientoLote: values.fechaVencimientoLote || undefined,
        fechaPruebaHidrostatica: values.fechaPruebaHidrostatica || undefined,
        observacion: values.observacion ?? '',
      },
    })
    emit('saved')
  } catch {
    // toast en mutation
  }
})

watch(
  () => [props.active, props.mode] as const,
  ([isActive, mode]) => {
    if (isActive && mode === 'create') {
      resetCreateForm()
      if (props.initialIdGuiaSalida) {
        idGuiaSalida.value = props.initialIdGuiaSalida
      }
    }
  },
  { immediate: true },
)

watch(recargaDetalle, () => {
  if (props.active && props.mode === 'edit') {
    syncFormValues()
    if (props.initialIdGuiaRetorno) {
      idGuiaRetorno.value = props.initialIdGuiaRetorno
    }
  }
})

watch(
  () => props.initialIdGuiaSalida,
  (id) => {
    if (props.mode === 'create' && id) {
      idGuiaSalida.value = id
    }
  },
)

watch(
  () => props.initialIdGuiaRetorno,
  (id) => {
    if (props.mode === 'edit' && id) {
      idGuiaRetorno.value = id
    }
  },
)
</script>
