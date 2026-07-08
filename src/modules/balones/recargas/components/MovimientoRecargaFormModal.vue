<template>
  <AppModal
    v-model="open"
    :title="mode === 'create' ? 'Nueva recarga' : 'Editar recarga'"
    :subtitle="
      mode === 'create'
        ? 'Registra el envío del cilindro a planta y su retorno con documentación.'
        : 'Actualiza los datos de la recarga seleccionada.'
    "
    size="xl"
    @close="handleClose"
  >
    <div
      v-if="isLoadingRecarga"
      class="py-8 text-center text-sm text-gray-500 dark:text-gray-400"
    >
      Cargando recarga...
    </div>

    <form
      v-else
      id="movimiento-recarga-form"
      class="space-y-6"
      autocomplete="off"
      @submit="onSubmit"
    >
      <div
        v-if="mode === 'edit' && recargaDetalle"
        class="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm dark:border-gray-800 dark:bg-white/[0.03]"
      >
        <p class="font-medium text-gray-800 dark:text-white/90">
          Cilindro: {{ recargaDetalle.codigo_balon }}
        </p>
      </div>

      <div class="space-y-4">
        <h5 class="text-sm font-semibold text-gray-800 dark:text-white/90">Salida de almacén</h5>
        <div class="grid gap-4 sm:grid-cols-2">
          <AppInput
            v-model="fechaSalidaAlmacen"
            label="Fecha salida"
            type="date"
            required
            v-bind="fechaSalidaAlmacenAttrs"
            :disabled="isSubmitting"
            :error="errors.fechaSalidaAlmacen"
          />

          <AppSelect
            v-if="mode === 'create'"
            v-model="idBalon"
            label="Cilindro"
            placeholder="Selecciona cilindro"
            required
            v-bind="idBalonAttrs"
            :disabled="isSubmitting || balonesQuery.isLoading.value"
            :error="errors.idBalon"
            :options="balonOptions"
          />

          <AppSelect
            v-model="idAlmacen"
            label="Almacén"
            placeholder="Opcional"
            v-bind="idAlmacenAttrs"
            :disabled="isSubmitting || almacenesQuery.isLoading.value"
            :options="almacenOptions"
          />

          <AppSelect
            v-model="idProducto"
            label="Producto (gas)"
            placeholder="Opcional"
            v-bind="idProductoAttrs"
            :disabled="isSubmitting || productosQuery.isLoading.value"
            :options="gasOptions"
          />

          <AppInput
            v-model="capacidad"
            label="Capacidad"
            type="number"
            min="0"
            step="0.0001"
            v-bind="capacidadAttrs"
            :disabled="isSubmitting"
            :error="errors.capacidad"
          />

          <AppSelect
            v-model="idUnidadMedida"
            label="Unidad de medida"
            placeholder="Opcional"
            v-bind="idUnidadMedidaAttrs"
            :disabled="isSubmitting || unidadMedidaQuery.isFetching.value"
            :options="unidadMedidaOptions"
          />
        </div>
      </div>

      <div class="space-y-4 border-t border-gray-100 pt-5 dark:border-gray-800">
        <h5 class="text-sm font-semibold text-gray-800 dark:text-white/90">Guías de remisión</h5>
        <div class="grid gap-4 sm:grid-cols-2">
          <AppInput
            v-model="serieGuiaSalida"
            label="Serie GRE salida"
            placeholder="T001"
            v-bind="serieGuiaSalidaAttrs"
            :disabled="isSubmitting"
            :error="errors.serieGuiaSalida"
          />
          <AppInput
            v-model="numeroGuiaSalida"
            label="Número GRE salida"
            placeholder="00000001"
            v-bind="numeroGuiaSalidaAttrs"
            :disabled="isSubmitting"
            :error="errors.numeroGuiaSalida"
          />
          <AppInput
            v-model="serieGuiaIngreso"
            label="Serie GRE ingreso"
            placeholder="T001"
            v-bind="serieGuiaIngresoAttrs"
            :disabled="isSubmitting"
            :error="errors.serieGuiaIngreso"
          />
          <AppInput
            v-model="numeroGuiaIngreso"
            label="Número GRE ingreso"
            placeholder="00000002"
            v-bind="numeroGuiaIngresoAttrs"
            :disabled="isSubmitting"
            :error="errors.numeroGuiaIngreso"
          />
        </div>
      </div>

      <div class="space-y-4 border-t border-gray-100 pt-5 dark:border-gray-800">
        <h5 class="text-sm font-semibold text-gray-800 dark:text-white/90">Factura</h5>
        <div class="grid gap-4 sm:grid-cols-2">
          <AppInput
            v-model="serieFactura"
            label="Serie factura"
            placeholder="F001"
            v-bind="serieFacturaAttrs"
            :disabled="isSubmitting"
            :error="errors.serieFactura"
          />
          <AppInput
            v-model="numeroFactura"
            label="Número factura"
            placeholder="00000001"
            v-bind="numeroFacturaAttrs"
            :disabled="isSubmitting"
            :error="errors.numeroFactura"
          />
          <AppInput
            v-model="idComprobante"
            label="ID comprobante"
            type="number"
            min="1"
            step="1"
            placeholder="Opcional"
            v-bind="idComprobanteAttrs"
            :disabled="isSubmitting"
          />
        </div>
      </div>

      <div class="space-y-4 border-t border-gray-100 pt-5 dark:border-gray-800">
        <h5 class="text-sm font-semibold text-gray-800 dark:text-white/90">Retorno y lote</h5>
        <div class="grid gap-4 sm:grid-cols-2">
          <AppInput
            v-model="fechaLlegadaAlmacen"
            label="Fecha llegada almacén"
            type="date"
            v-bind="fechaLlegadaAlmacenAttrs"
            :disabled="isSubmitting"
          />

          <AppSelect
            v-model="idProveedor"
            label="Proveedor / planta"
            placeholder="Opcional"
            v-bind="idProveedorAttrs"
            :disabled="isSubmitting || clientesQuery.isLoading.value"
            :options="proveedorOptions"
          />

          <AppInput
            v-model="lote"
            label="Lote"
            placeholder="Lote de recarga"
            v-bind="loteAttrs"
            :disabled="isSubmitting"
            :error="errors.lote"
          />

          <AppInput
            v-model="fechaVencimientoLote"
            label="Vencimiento lote"
            type="date"
            v-bind="fechaVencimientoLoteAttrs"
            :disabled="isSubmitting"
          />

          <AppInput
            v-model="fechaPruebaHidrostatica"
            label="Prueba hidrostática (P.H.)"
            type="date"
            v-bind="fechaPruebaHidrostaticaAttrs"
            :disabled="isSubmitting"
          />
        </div>
      </div>

      <AppTextarea
        v-model="observacion"
        label="Observación"
        placeholder="Detalle adicional"
        :rows="3"
        v-bind="observacionAttrs"
        :disabled="isSubmitting"
        :error="errors.observacion"
      />
    </form>

    <template #footer>
      <button
        type="button"
        class="flex w-full justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-white/[0.03] sm:w-auto"
        :disabled="isSubmitting || isLoadingRecarga"
        @click="handleClose"
      >
        Cancelar
      </button>
      <button
        type="submit"
        form="movimiento-recarga-form"
        class="flex w-full justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
        :disabled="isSubmitting || isLoadingRecarga"
      >
        {{
          isSubmitting
            ? 'Guardando...'
            : mode === 'create'
              ? 'Registrar recarga'
              : 'Guardar cambios'
        }}
      </button>
    </template>
  </AppModal>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/yup'
import * as yup from 'yup'
import { useListaOpcionesQuery } from '@/modules/catalogos/composables/useListaOpcionesQuery'
import { toSelectOptions } from '@/modules/catalogos/utils/toSelectOptions'
import { useAlmacenesQuery } from '@/modules/configuracion/almacenes/composables/useAlmacenesQuery'
import { useClientesQuery } from '@/modules/clientes/composables/useClientesQuery'
import { useBalonesQuery } from '@/modules/balones/cilindros/composables/useBalonesQuery'
import {
  useCreateMovimientoRecargaMutation,
  useUpdateMovimientoRecargaMutation,
} from '@/modules/balones/recargas/composables/useMovimientoRecargaMutations'
import { useMovimientoRecargaQuery } from '@/modules/balones/recargas/composables/useMovimientosRecargaQuery'
import type { MovimientoRecargaFormMode } from '@/modules/balones/recargas/interfaces/movimiento-recarga.interface'
import { useProductosQuery } from '@/modules/productos/articulos/composables/useProductosQuery'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { AppInput, AppModal, AppSelect, AppTextarea } from '@/shared/components'
import { ListaIds } from '@/shared/constants/lista-ids'
import { optionalNumber, optionalString, requiredString } from '@/shared/validation'

interface MovimientoRecargaFormModalProps {
  mode: MovimientoRecargaFormMode
  recargaId?: number | null
}

const props = defineProps<MovimientoRecargaFormModalProps>()

const open = defineModel<boolean>({ default: false })

const emit = defineEmits<{
  saved: []
}>()

const authStore = useAuthStore()
const createMutation = useCreateMovimientoRecargaMutation()
const updateMutation = useUpdateMovimientoRecargaMutation()

const recargaIdRef = computed(() => (props.mode === 'edit' ? props.recargaId : null))
const recargaQuery = useMovimientoRecargaQuery(recargaIdRef)
const isLoadingRecarga = computed(
  () => props.mode === 'edit' && open.value && recargaQuery.isFetching.value,
)
const recargaDetalle = computed(() => recargaQuery.data.value ?? null)

const balonesFilters = ref({ pagina: 1, limite: 200 })
const balonesQuery = useBalonesQuery(balonesFilters)

const almacenesFilters = ref({ pagina: 1, limite: 200 })
const almacenesQuery = useAlmacenesQuery(almacenesFilters)

const productosFilters = ref({ pagina: 1, limite: 200, esGas: true })
const productosQuery = useProductosQuery(productosFilters)

const clientesFilters = ref({ pagina: 1, limite: 200, soloActivos: 1 as number })
const clientesQuery = useClientesQuery(clientesFilters)

const listaUnidadMedidaId = ref(ListaIds.UNIDAD_MEDIDA)
const unidadMedidaQuery = useListaOpcionesQuery(listaUnidadMedidaId)

const balonOptions = computed(() =>
  (balonesQuery.data.value?.data ?? []).map((balon) => ({
    value: balon.id,
    label: balon.codigo_balon,
  })),
)

const almacenOptions = computed(() => [
  { value: '', label: 'Sin almacén' },
  ...(almacenesQuery.data.value?.data ?? []).map((almacen) => ({
    value: almacen.id,
    label: almacen.nombre,
  })),
])

const gasOptions = computed(() => [
  { value: '', label: 'Sin producto' },
  ...(productosQuery.data.value?.data ?? []).map((producto) => ({
    value: producto.id,
    label: `${producto.codigo} — ${producto.nombre}`,
  })),
])

const proveedorOptions = computed(() => [
  { value: '', label: 'Sin proveedor' },
  ...(clientesQuery.data.value?.data ?? []).map((cliente) => ({
    value: cliente.id,
    label:
      cliente.razon_social ||
      [cliente.nombres, cliente.apellido_paterno].filter(Boolean).join(' ') ||
      cliente.numero_documento,
  })),
])

const unidadMedidaOptions = computed(() => [
  { value: '', label: 'Sin unidad' },
  ...toSelectOptions(unidadMedidaQuery.data.value),
])

const today = () => new Date().toISOString().slice(0, 10)
const toDateInput = (value?: string | null) => (value ? value.slice(0, 10) : '')

const optionalSelectNumber = () =>
  yup
    .mixed<string | number>()
    .transform((value) => (value === '' ? undefined : value))
    .optional()

const { defineField, handleSubmit, resetForm, errors, isSubmitting } = useForm({
  validationSchema: toTypedSchema(
    yup.object({
      fechaSalidaAlmacen: requiredString('La fecha de salida'),
      idBalon: yup.number().optional(),
      idAlmacen: optionalSelectNumber(),
      idProducto: optionalSelectNumber(),
      capacidad: optionalNumber().min(0, 'Debe ser mayor o igual a cero'),
      idUnidadMedida: optionalSelectNumber(),
      serieGuiaSalida: optionalString().max(10, 'Máximo 10 caracteres'),
      numeroGuiaSalida: optionalString().max(15, 'Máximo 15 caracteres'),
      serieGuiaIngreso: optionalString().max(10, 'Máximo 10 caracteres'),
      numeroGuiaIngreso: optionalString().max(15, 'Máximo 15 caracteres'),
      serieFactura: optionalString().max(10, 'Máximo 10 caracteres'),
      numeroFactura: optionalString().max(15, 'Máximo 15 caracteres'),
      idComprobante: optionalNumber().min(1, 'ID inválido'),
      fechaLlegadaAlmacen: optionalString(),
      lote: optionalString().max(50, 'Máximo 50 caracteres'),
      fechaVencimientoLote: optionalString(),
      fechaPruebaHidrostatica: optionalString(),
      idProveedor: optionalSelectNumber(),
      observacion: optionalString().max(500, 'Máximo 500 caracteres'),
    }),
  ),
  initialValues: {
    fechaSalidaAlmacen: today(),
    idBalon: undefined as number | undefined,
    idAlmacen: '' as string | number,
    idProducto: '' as string | number,
    capacidad: undefined as number | undefined,
    idUnidadMedida: '' as string | number,
    serieGuiaSalida: '',
    numeroGuiaSalida: '',
    serieGuiaIngreso: '',
    numeroGuiaIngreso: '',
    serieFactura: '',
    numeroFactura: '',
    idComprobante: undefined as number | undefined,
    fechaLlegadaAlmacen: '',
    lote: '',
    fechaVencimientoLote: '',
    fechaPruebaHidrostatica: '',
    idProveedor: '' as string | number,
    observacion: '',
  },
})

const [fechaSalidaAlmacen, fechaSalidaAlmacenAttrs] = defineField('fechaSalidaAlmacen')
const [idBalon, idBalonAttrs] = defineField('idBalon')
const [idAlmacen, idAlmacenAttrs] = defineField('idAlmacen')
const [idProducto, idProductoAttrs] = defineField('idProducto')
const [capacidad, capacidadAttrs] = defineField('capacidad')
const [idUnidadMedida, idUnidadMedidaAttrs] = defineField('idUnidadMedida')
const [serieGuiaSalida, serieGuiaSalidaAttrs] = defineField('serieGuiaSalida')
const [numeroGuiaSalida, numeroGuiaSalidaAttrs] = defineField('numeroGuiaSalida')
const [serieGuiaIngreso, serieGuiaIngresoAttrs] = defineField('serieGuiaIngreso')
const [numeroGuiaIngreso, numeroGuiaIngresoAttrs] = defineField('numeroGuiaIngreso')
const [serieFactura, serieFacturaAttrs] = defineField('serieFactura')
const [numeroFactura, numeroFacturaAttrs] = defineField('numeroFactura')
const [idComprobante, idComprobanteAttrs] = defineField('idComprobante')
const [fechaLlegadaAlmacen, fechaLlegadaAlmacenAttrs] = defineField('fechaLlegadaAlmacen')
const [lote, loteAttrs] = defineField('lote')
const [fechaVencimientoLote, fechaVencimientoLoteAttrs] = defineField('fechaVencimientoLote')
const [fechaPruebaHidrostatica, fechaPruebaHidrostaticaAttrs] =
  defineField('fechaPruebaHidrostatica')
const [idProveedor, idProveedorAttrs] = defineField('idProveedor')
const [observacion, observacionAttrs] = defineField('observacion')

const toOptionalNumber = (value: string | number | undefined) =>
  value !== '' && value != null ? Number(value) : undefined

const buildPayloadFields = (values: {
  fechaSalidaAlmacen: string
  idAlmacen?: string | number
  idProducto?: string | number
  capacidad?: number
  idUnidadMedida?: string | number
  serieGuiaSalida: string
  numeroGuiaSalida: string
  serieGuiaIngreso: string
  numeroGuiaIngreso: string
  serieFactura: string
  numeroFactura: string
  idComprobante?: number
  fechaLlegadaAlmacen: string
  lote: string
  fechaVencimientoLote: string
  fechaPruebaHidrostatica: string
  idProveedor?: string | number
  observacion: string
}) => ({
  fechaSalidaAlmacen: values.fechaSalidaAlmacen,
  idAlmacen: toOptionalNumber(values.idAlmacen),
  idProducto: toOptionalNumber(values.idProducto),
  capacidad: values.capacidad,
  idUnidadMedida: toOptionalNumber(values.idUnidadMedida),
  serieGuiaSalida: values.serieGuiaSalida || undefined,
  numeroGuiaSalida: values.numeroGuiaSalida || undefined,
  serieGuiaIngreso: values.serieGuiaIngreso || undefined,
  numeroGuiaIngreso: values.numeroGuiaIngreso || undefined,
  serieFactura: values.serieFactura || undefined,
  numeroFactura: values.numeroFactura || undefined,
  idComprobante: values.idComprobante ? Number(values.idComprobante) : undefined,
  fechaLlegadaAlmacen: values.fechaLlegadaAlmacen || undefined,
  lote: values.lote || undefined,
  fechaVencimientoLote: values.fechaVencimientoLote || undefined,
  fechaPruebaHidrostatica: values.fechaPruebaHidrostatica || undefined,
  idProveedor: toOptionalNumber(values.idProveedor),
  observacion: values.observacion || undefined,
})

const syncFormValues = () => {
  const data = recargaDetalle.value
  resetForm({
    values: {
      fechaSalidaAlmacen: toDateInput(data?.fecha_salida_almacen) || today(),
      idBalon: data?.id_balon ?? undefined,
      idAlmacen: data?.id_almacen ?? '',
      idProducto: data?.id_producto ?? '',
      capacidad: data?.capacidad ?? undefined,
      idUnidadMedida: data?.id_unidad_medida ?? '',
      serieGuiaSalida: data?.serie_guia_salida ?? '',
      numeroGuiaSalida: data?.numero_guia_salida ?? '',
      serieGuiaIngreso: data?.serie_guia_ingreso ?? '',
      numeroGuiaIngreso: data?.numero_guia_ingreso ?? '',
      serieFactura: data?.serie_factura ?? '',
      numeroFactura: data?.numero_factura ?? '',
      idComprobante: data?.id_comprobante ?? undefined,
      fechaLlegadaAlmacen: toDateInput(data?.fecha_llegada_almacen),
      lote: data?.lote ?? '',
      fechaVencimientoLote: toDateInput(data?.fecha_vencimiento_lote),
      fechaPruebaHidrostatica: toDateInput(data?.fecha_prueba_hidrostatica),
      idProveedor: data?.id_proveedor ?? '',
      observacion: data?.observacion ?? '',
    },
  })
}

const resetCreateForm = () => {
  resetForm({
    values: {
      fechaSalidaAlmacen: today(),
      idBalon: undefined,
      idAlmacen: '',
      idProducto: '',
      capacidad: undefined,
      idUnidadMedida: '',
      serieGuiaSalida: '',
      numeroGuiaSalida: '',
      serieGuiaIngreso: '',
      numeroGuiaIngreso: '',
      serieFactura: '',
      numeroFactura: '',
      idComprobante: undefined,
      fechaLlegadaAlmacen: '',
      lote: '',
      fechaVencimientoLote: '',
      fechaPruebaHidrostatica: '',
      idProveedor: '',
      observacion: '',
    },
  })
}

const handleClose = () => {
  open.value = false
}

const onSubmit = handleSubmit(async (values) => {
  const currentUserId = authStore.user?.id
  if (!currentUserId) return

  const fields = buildPayloadFields({
    ...values,
    serieGuiaSalida: values.serieGuiaSalida ?? '',
    numeroGuiaSalida: values.numeroGuiaSalida ?? '',
    serieGuiaIngreso: values.serieGuiaIngreso ?? '',
    numeroGuiaIngreso: values.numeroGuiaIngreso ?? '',
    serieFactura: values.serieFactura ?? '',
    numeroFactura: values.numeroFactura ?? '',
    fechaLlegadaAlmacen: values.fechaLlegadaAlmacen ?? '',
    lote: values.lote ?? '',
    fechaVencimientoLote: values.fechaVencimientoLote ?? '',
    fechaPruebaHidrostatica: values.fechaPruebaHidrostatica ?? '',
    observacion: values.observacion ?? '',
  })

  try {
    if (props.mode === 'create') {
      if (!values.idBalon) return

      await createMutation.mutateAsync({
        idUsuarioAuditoria: currentUserId,
        idBalon: Number(values.idBalon),
        ...fields,
      })
    } else if (props.recargaId) {
      await updateMutation.mutateAsync({
        id: props.recargaId,
        payload: {
          idUsuarioAuditoria: currentUserId,
          ...fields,
        },
      })
    } else {
      return
    }

    emit('saved')
    open.value = false
  } catch {
    // toast en mutation
  }
})

watch(
  () => open.value,
  (isOpen) => {
    if (isOpen && props.mode === 'create') {
      resetCreateForm()
    }
  },
)

watch(recargaDetalle, () => {
  if (open.value && props.mode === 'edit') {
    syncFormValues()
  }
})
</script>
