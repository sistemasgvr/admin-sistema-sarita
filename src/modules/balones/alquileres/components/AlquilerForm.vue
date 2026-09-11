<template>
  <div>
    <div
      v-if="isLoadingAlquiler"
      class="py-8 text-center text-sm text-gray-500 dark:text-gray-400"
    >
      Cargando alquiler...
    </div>

    <div v-else class="space-y-5">
      <form
        id="alquiler-form"
        class="space-y-5"
        autocomplete="off"
        @submit="onSubmit"
      >
        <FormCardsLayout>
          <DetailSectionCard
            title="Datos generales"
            :icon="ICONS.clipboardList"
            :help="
              isCreateMode
                ? 'El número se genera automáticamente (correlativo). El estado inicia en Activo.'
                : undefined
            "
          >
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <AppInput
                v-model="numeroAlquiler"
                label="Número de alquiler"
                placeholder="Cargando correlativo..."
                v-bind="numeroAlquilerAttrs"
                :disabled="isSubmitting || isCreateMode || cargandoNumero"
                :error="errors.numeroAlquiler"
              />

              <AppSelect
                v-model="idEstado"
                label="Estado"
                placeholder="Selecciona estado"
                v-bind="idEstadoAttrs"
                :disabled="
                  isSubmitting ||
                  estadosAlquilerQuery.isFetching.value ||
                  isCreateMode
                "
                :options="estadoAlquilerOptions"
                :hint="isCreateMode ? 'Activo por defecto' : undefined"
              />

              <ClienteSelectField
                v-model="idCliente"
                required
                :disabled="isSubmitting"
                :error="errors.idCliente"
              />

              <AlmacenSelectField
                v-model="idAlmacen"
                required
                :disabled="isSubmitting"
                :error="errors.idAlmacen"
              />
            </div>
          </DetailSectionCard>

          <DetailSectionCard
            title="Vigencia"
            :icon="ICONS.calendar"
            help="La vigencia es del accesorio alquilado. El cilindro no se alquila: si se entrega, es un préstamo y su recojo se agenda en Actividades."
          >
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <AppInput
                v-model="fechaInicio"
                label="Fecha inicio"
                type="date"
                required
                v-bind="fechaInicioAttrs"
                :disabled="isSubmitting"
                :error="errors.fechaInicio"
              />

              <AppInput
                v-model="fechaFinPactada"
                label="Fin pactado"
                type="date"
                required
                v-bind="fechaFinPactadaAttrs"
                :disabled="isSubmitting"
                :error="errors.fechaFinPactada"
              />

              <AppInput
                v-model="fechaFinReal"
                label="Fin real"
                type="date"
                optional
                v-bind="fechaFinRealAttrs"
                :disabled="isSubmitting"
              />
            </div>
          </DetailSectionCard>

          <DetailSectionCard
            title="Producto y cobro"
            :icon="ICONS.creditCard"
            help="Solo accesorios alquilables (regulador, etc.). No se alquila el envase. El cobro del periodo se hace en el POS o con Renovar."
          >
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <ProductoSelectField
                v-model="idProductoRegulador"
                v-model:search="productoAlquilableBuscar"
                label="Producto alquilable"
                placeholder="Selecciona producto alquilable"
                search-placeholder="Código o nombre..."
                :es-alquilable="true"
                :id-almacen="idAlmacen === '' || idAlmacen == null ? undefined : Number(idAlmacen)"
                :options="productoAlquilableOptions"
                :bloquear-sin-stock="isCreateMode"
                :disabled="isSubmitting || (isCreateMode && !idAlmacen)"
                :required="isCreateMode"
                class="sm:col-span-2"
              />

              <AppFormField
                v-if="isCreateMode"
                label="Garantía / depósito"
                optional
                :error="errorMontoGarantiaDisplay"
              >
                <MoneyInput
                  v-model="montoGarantia"
                  placeholder="0.00"
                  :disabled="isSubmitting"
                  :state="errorMontoGarantiaDisplay ? 'error' : 'default'"
                  @blur="onBlurMontoGarantia"
                />
              </AppFormField>

              <div
                v-if="isCreateMode && montoGarantiaNum > 0"
                class="sm:col-span-2"
              >
                <GarantiaRecepcionFields
                  v-model:id-medio-pago="idMedioPagoGarantia"
                  v-model:id-cuenta-bancaria="idCuentaBancariaGarantia"
                  v-model:numero-operacion="numeroOperacionGarantia"
                  v-model:observacion="observacionGarantia"
                  v-model:valido="garantiaRecepcionValida"
                  :disabled="isSubmitting"
                />
              </div>

              <AppFormField label="Tarifa periodo" optional :error="errorTarifaDisplay">
                <MoneyInput
                  v-model="tarifaDiaria"
                  placeholder="0.00"
                  :disabled="isSubmitting"
                  :state="errorTarifaDisplay ? 'error' : 'default'"
                  @blur="onBlurTarifa"
                />
              </AppFormField>

              <AppFormField label="Total cobrado" optional :error="errorTotalCobradoDisplay">
                <MoneyInput
                  v-model="totalCobrado"
                  placeholder="0.00"
                  :disabled="isSubmitting"
                  :state="errorTotalCobradoDisplay ? 'error' : 'default'"
                  @blur="onBlurTotalCobrado"
                />
              </AppFormField>

              <AppInput
                v-model="idComprobanteVenta"
                label="ID comprobante venta"
                type="number"
                min="1"
                step="1"
                optional
                placeholder="Ej. 1250"
                v-bind="idComprobanteVentaAttrs"
                :disabled="isSubmitting"
                class="sm:col-span-2"
              />
            </div>
          </DetailSectionCard>

          <DetailSectionCard title="Observación" :icon="ICONS.messageSquare" :full-width="true">
            <AppTextarea
              v-model="observacion"
              label="Observación"
              placeholder="Notas adicionales del alquiler"
              optional
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
            :disabled="isSubmitting"
            @click="emit('cancel')"
          >
            {{ activeAlquilerId ? 'Cerrar' : 'Cancelar' }}
          </button>
          <button
            type="submit"
            class="flex w-full justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
            :disabled="isSubmitting || !formularioValido"
          >
            {{
              isSubmitting
                ? 'Guardando...'
                : isCreateMode && !activeAlquilerId
                  ? 'Crear alquiler'
                  : 'Guardar cambios'
            }}
          </button>
        </div>
      </form>

    </div>

  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/yup'
import * as yup from 'yup'
import { useListaOpcionesQuery } from '@/modules/catalogos/composables/useListaOpcionesQuery'
import { toSelectOptions } from '@/modules/catalogos/utils/toSelectOptions'
import AlmacenSelectField from '@/modules/configuracion/almacenes/components/AlmacenSelectField.vue'
import ClienteSelectField from '@/modules/clientes/components/ClienteSelectField.vue'
import ProductoSelectField from '@/modules/productos/articulos/components/ProductoSelectField.vue'
import { productosService } from '@/modules/productos/articulos/services/productos.service'
import { catalogoPreciosService } from '@/modules/productos/catalogo-precios/services/catalogo-precios.service'
import {
  useCreateAlquilerMutation,
  useUpdateAlquilerMutation,
} from '@/modules/balones/alquileres/composables/useAlquilerMutations'
import { useAlquilerQuery } from '@/modules/balones/alquileres/composables/useAlquileresQuery'
import { alquileresService } from '@/modules/balones/alquileres/services/alquileres.service'
import GarantiaRecepcionFields from '@/modules/balones/garantias/components/GarantiaRecepcionFields.vue'
import { garantiasService } from '@/modules/balones/garantias/services/garantias.service'
import type { AlquilerFormMode } from '@/modules/balones/alquileres/interfaces/alquiler.interface'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { AppInput, AppSelect, AppTextarea, MoneyInput } from '@/shared/components'
import AppFormField from '@/shared/components/form/AppFormField.vue'
import DetailSectionCard from '@/shared/components/detail/DetailSectionCard.vue'
import FormCardsLayout from '@/shared/components/detail/FormCardsLayout.vue'
import { useMoneyField } from '@/shared/composables/useMoneyField'
import { ICONS } from '@/shared/constants/icons'
import { ListaIds } from '@/shared/constants/lista-ids'
import { toastApiError, toastWarning } from '@/shared/composables/useToast'
import { parseMoneyInput, roundMoney } from '@/shared/utils/currency'
import { yupMontoMoneda } from '@/shared/utils/yupMoney'
import {
  optionalNumber,
  optionalString,
  requiredSelect,
  requiredString,
} from '@/shared/validation'

export type AlquilerFormSavedPayload = { id: number }

interface AlquilerFormProps {
  mode: AlquilerFormMode
  alquilerId?: number | null
  /** When true, sync/load form. Page: always true. Modal: equals open. */
  active: boolean
}

const props = withDefaults(defineProps<AlquilerFormProps>(), {
  alquilerId: null,
})

const emit = defineEmits<{
  saved: [payload?: AlquilerFormSavedPayload]
  created: [payload: AlquilerFormSavedPayload]
  cancel: []
}>()

const authStore = useAuthStore()
const createMutation = useCreateAlquilerMutation()
const cargandoNumero = ref(false)
const updateMutation = useUpdateAlquilerMutation()

const internalMode = ref<AlquilerFormMode>(props.mode)
const activeAlquilerId = ref<number | null>(null)

const isCreateMode = computed(() => internalMode.value === 'create' && !activeAlquilerId.value)

const alquilerIdRef = computed(() => activeAlquilerId.value)
const alquilerQuery = useAlquilerQuery(alquilerIdRef)
const isLoadingAlquiler = computed(
  () => !isCreateMode.value && props.active && alquilerQuery.isFetching.value,
)


const listaEstadoAlquilerId = ref(ListaIds.ESTADO_ALQUILER)
const estadosAlquilerQuery = useListaOpcionesQuery(listaEstadoAlquilerId)

const estadoAlquilerOptions = computed(() => [
  { value: '', label: 'Sin estado' },
  ...toSelectOptions(estadosAlquilerQuery.data.value),
])

const idEstadoActivo = computed(
  () =>
    estadosAlquilerQuery.data.value?.find(
      (item) => (item.nombre ?? '').toUpperCase() === 'ACTIVO',
    )?.id ?? null,
)


const toDateInput = (value?: string | null) => (value ? value.slice(0, 10) : '')

const optionalSelectNumber = () =>
  yup
    .mixed<string | number>()
    .transform((value) => (value === '' ? undefined : value))
    .optional()

const moneyOptsOptional = { min: 0, allowZero: true } as const

const { defineField, handleSubmit, resetForm, errors, isSubmitting, meta } = useForm({
  validationSchema: toTypedSchema(
    yup.object({
      numeroAlquiler: optionalString().max(30, 'Máximo 30 caracteres'),
      idCliente: requiredSelect('El cliente'),
      idAlmacen: requiredSelect('El almacén'),
      fechaInicio: requiredString('La fecha de inicio'),
      fechaFinPactada: requiredString('La fecha de fin'),
      fechaFinReal: optionalString(),
      tarifaDiaria: yupMontoMoneda({ optional: true, ...moneyOptsOptional }),
      totalCobrado: yupMontoMoneda({ optional: true, ...moneyOptsOptional }),
      idEstado: optionalSelectNumber(),
      observacion: optionalString().max(500, 'Máximo 500 caracteres'),
      idComprobanteVenta: optionalNumber().min(1, 'ID inválido'),
      idProductoRegulador: optionalSelectNumber(),
    }),
  ),
  initialValues: {
    numeroAlquiler: '',
    idCliente: '' as string | number,
    idAlmacen: '' as string | number,
    fechaInicio: '',
    fechaFinPactada: '',
    fechaFinReal: '',
    tarifaDiaria: '',
    totalCobrado: '',
    idEstado: '' as string | number,
    observacion: '',
    idComprobanteVenta: undefined as number | undefined,
    idProductoRegulador: '' as string | number,
  },
})

const [numeroAlquiler, numeroAlquilerAttrs] = defineField('numeroAlquiler')
const [idCliente] = defineField('idCliente')
const [idAlmacen] = defineField('idAlmacen')
const [fechaInicio, fechaInicioAttrs] = defineField('fechaInicio')
const [fechaFinPactada, fechaFinPactadaAttrs] = defineField('fechaFinPactada')
const [fechaFinReal, fechaFinRealAttrs] = defineField('fechaFinReal')
const [tarifaDiaria] = defineField('tarifaDiaria')
const [totalCobrado] = defineField('totalCobrado')
const { error: errorTarifa, valido: tarifaValidoRaw, onBlur: onBlurTarifa } = useMoneyField(
  tarifaDiaria,
  moneyOptsOptional,
)
const tarifaDiariaValido = computed(
  () => !(tarifaDiaria.value ?? '').trim() || tarifaValidoRaw.value,
)
const errorTarifaDisplay = computed(
  () =>
    errors.value.tarifaDiaria ||
    ((tarifaDiaria.value ?? '').trim() ? errorTarifa.value : ''),
)
const { error: errorTotalCobrado, valido: totalCobradoValidoRaw, onBlur: onBlurTotalCobrado } =
  useMoneyField(totalCobrado, moneyOptsOptional)
const totalCobradoValido = computed(
  () => !(totalCobrado.value ?? '').trim() || totalCobradoValidoRaw.value,
)
const errorTotalCobradoDisplay = computed(
  () =>
    errors.value.totalCobrado ||
    ((totalCobrado.value ?? '').trim() ? errorTotalCobrado.value : ''),
)
const [idEstado, idEstadoAttrs] = defineField('idEstado')
const [observacion, observacionAttrs] = defineField('observacion')
const [idComprobanteVenta, idComprobanteVentaAttrs] = defineField('idComprobanteVenta')
const [idProductoRegulador] = defineField('idProductoRegulador')

watch(
  () => [isCreateMode.value, idEstadoActivo.value] as const,
  ([create, activoId]) => {
    if (!create || !activoId) return
    if (!idEstado.value) idEstado.value = activoId
  },
  { immediate: true },
)

const productoAlquilableBuscar = ref('')
const montoGarantia = ref('')
const idMedioPagoGarantia = ref<string | number>('')
const idCuentaBancariaGarantia = ref<number | null>(null)
const numeroOperacionGarantia = ref('')
const observacionGarantia = ref('')
/** MedioPagoCuentaField lo publica: false mientras falte la cuenta obligatoria. */
const garantiaRecepcionValida = ref(true)

const { error: errorMontoGarantia, valido: montoGarantiaValidoRaw, onBlur: onBlurMontoGarantia } =
  useMoneyField(montoGarantia, moneyOptsOptional)
const montoGarantiaValido = computed(
  () => !montoGarantia.value.trim() || montoGarantiaValidoRaw.value,
)
const errorMontoGarantiaDisplay = computed(() =>
  montoGarantia.value.trim() ? errorMontoGarantia.value : '',
)
const montoGarantiaNum = computed(() => roundMoney(parseMoneyInput(montoGarantia.value) ?? 0))
const formularioValido = computed(
  () =>
    meta.value.valid &&
    tarifaDiariaValido.value &&
    totalCobradoValido.value &&
    (!isCreateMode.value || montoGarantiaValido.value),
)

const productoAlquilableOptions = computed(() => {
  const data = alquilerQuery.data.value
  const id = data?.id_producto_regulador ?? data?.id_producto_stock
  const nombre = data?.nombre_producto_regulador ?? data?.nombre_producto_stock
  const codigo = data?.codigo_producto_regulador ?? data?.codigo_producto_stock
  if (!id || !nombre) return []
  return [
    {
      value: id,
      label: `${codigo ? `${codigo} — ` : ''}${nombre}`,
    },
  ]
})

async function prefillMontoGarantia(productoId: number) {
  try {
    const prod = await productosService.obtenerPorId(productoId)
    let sugerido = Number(prod.precio_garantia ?? 0)

    try {
      const catalogo = await catalogoPreciosService.listar({
        idProducto: productoId,
        pagina: 1,
        limite: 5,
      })
      const conGarantia = (catalogo.data ?? []).find(
        (row) => row.precio_garantia != null && Number(row.precio_garantia) > 0,
      )
      if (conGarantia) {
        sugerido = Number(conGarantia.precio_garantia)
      }
    } catch {
      // sin catálogo
    }

    const tarifaTexto = tarifaDiaria.value ?? ''
    if (!tarifaTexto.trim() || roundMoney(parseMoneyInput(tarifaTexto) ?? 0) === 0) {
      const precio = Number(prod.precio ?? 0)
      tarifaDiaria.value = precio > 0 ? precio.toFixed(2) : ''
    }

    montoGarantia.value = sugerido > 0 ? sugerido.toFixed(2) : '0.00'
  } catch {
    montoGarantia.value = '0.00'
  }
}

const toOptionalNumber = (value: string | number | undefined) =>
  value !== '' && value != null ? Number(value) : undefined

const buildPayloadFields = (values: {
  numeroAlquiler?: string
  idCliente?: string | number
  idAlmacen?: string | number
  fechaInicio?: string
  fechaFinPactada?: string
  fechaFinReal?: string
  tarifaDiaria?: string
  totalCobrado?: string
  idEstado?: string | number
  observacion?: string
  idComprobanteVenta?: number
  idProductoRegulador?: string | number
}) => ({
  numeroAlquiler: values.numeroAlquiler || undefined,
  idCliente: toOptionalNumber(values.idCliente),
  idAlmacen: toOptionalNumber(values.idAlmacen),
  fechaInicio: values.fechaInicio || undefined,
  fechaFinPactada: values.fechaFinPactada || undefined,
  fechaFinReal: values.fechaFinReal || undefined,
  tarifaDiaria: values.tarifaDiaria?.trim()
    ? roundMoney(parseMoneyInput(values.tarifaDiaria))
    : undefined,
  totalCobrado: values.totalCobrado?.trim()
    ? roundMoney(parseMoneyInput(values.totalCobrado))
    : undefined,
  idEstado: toOptionalNumber(values.idEstado),
  observacion: values.observacion || undefined,
  idComprobanteVenta: values.idComprobanteVenta ? Number(values.idComprobanteVenta) : undefined,
  idProductoRegulador: toOptionalNumber(values.idProductoRegulador),
})

const syncFormValues = () => {
  const data = alquilerQuery.data.value
  if (!data) return

  resetForm({
    values: {
      numeroAlquiler: data.numero_alquiler ?? '',
      idCliente: data.id_cliente ?? '',
      idAlmacen: data.id_almacen ?? '',
      fechaInicio: toDateInput(data.fecha_inicio),
      fechaFinPactada: toDateInput(data.fecha_fin_pactada),
      fechaFinReal: toDateInput(data.fecha_fin_real),
      tarifaDiaria:
        data.tarifa_diaria != null ? roundMoney(data.tarifa_diaria).toFixed(2) : '',
      totalCobrado:
        data.total_cobrado != null ? roundMoney(data.total_cobrado).toFixed(2) : '',
      idEstado: data.id_estado ?? '',
      observacion: data.observacion ?? '',
      idComprobanteVenta: data.id_comprobante_venta ?? undefined,
      idProductoRegulador: data.id_producto_regulador ?? data.id_producto_stock ?? '',
    },
  })
}

async function cargarSiguienteNumero() {
  cargandoNumero.value = true
  try {
    const result = await alquileresService.obtenerSiguienteNumero()
    numeroAlquiler.value = result.numero?.trim() || ''
  } catch {
    numeroAlquiler.value = ''
  } finally {
    cargandoNumero.value = false
  }
}

const resetCreateForm = () => {
  resetForm({
    values: {
      numeroAlquiler: '',
      idCliente: '',
      idAlmacen: '',
      fechaInicio: new Date().toISOString().slice(0, 10),
      fechaFinPactada: '',
      fechaFinReal: '',
      tarifaDiaria: '',
      totalCobrado: '',
      idEstado: idEstadoActivo.value ?? '',
      observacion: '',
      idComprobanteVenta: undefined,
      idProductoRegulador: '',
    },
  })
  montoGarantia.value = '0.00'
  idMedioPagoGarantia.value = ''
  idCuentaBancariaGarantia.value = null
  numeroOperacionGarantia.value = ''
  observacionGarantia.value = ''
  void cargarSiguienteNumero()
}

const resetFormState = () => {
  internalMode.value = props.mode
  activeAlquilerId.value = props.mode === 'edit' && props.alquilerId ? props.alquilerId : null
}

const onSubmit = handleSubmit(async (values) => {
  const currentUserId = authStore.user?.id
  if (!currentUserId) return

  const fields = buildPayloadFields(values)

  try {
    if (isCreateMode.value) {
      const cliente = toOptionalNumber(values.idCliente)
      const almacen = toOptionalNumber(values.idAlmacen)
      const productoId = toOptionalNumber(values.idProductoRegulador)
      if (!cliente || !almacen || !values.fechaInicio) return
      if (!values.fechaFinPactada) {
        toastWarning('Indica la fecha de fin del alquiler')
        return
      }
      if (values.fechaFinPactada < values.fechaInicio) {
        toastWarning('La fecha de fin no puede ser anterior al inicio')
        return
      }
      if (!productoId) {
        toastWarning('Selecciona el producto alquilable')
        return
      }

      const garantiaPendiente = montoGarantiaNum.value
      if (garantiaPendiente > 0 && !idMedioPagoGarantia.value) {
        toastWarning('Indica el medio con el que se recibe la garantía')
        return
      }
      // Un medio como transferencia o billetera exige la cuenta de la empresa:
      // sin ella el backend rechaza el cobro de la garantía.
      if (garantiaPendiente > 0 && !garantiaRecepcionValida.value) {
        toastWarning('Completa la cuenta de la empresa que recibe la garantía')
        return
      }

      let idProductoStock: number | undefined
      try {
        const listado = await productosService.listar({
          esAlquilable: true,
          idAlmacen: almacen,
          pagina: 1,
          limite: 200,
          soloActivos: 1,
        })
        const producto =
          (listado.data ?? []).find((item) => item.id === productoId) ??
          (await productosService.obtenerPorId(productoId))

        if (producto.afecta_stock && !producto.es_servicio && !producto.es_gas) {
          if (producto.stock_actual != null && Number(producto.stock_actual) <= 0) {
            toastWarning(`${producto.nombre} no tiene stock disponible en el almacén`)
            return
          }
          idProductoStock = productoId
        }
      } catch {
        // sin detalle de stock: solo registra el producto alquilable
      }

      const created = await createMutation.mutateAsync({
        ...fields,
        idUsuarioAuditoria: currentUserId,
        numeroAlquiler: values.numeroAlquiler?.trim() || undefined,
        idCliente: cliente,
        idAlmacen: almacen,
        fechaInicio: values.fechaInicio,
        fechaFinPactada: values.fechaFinPactada,
        idEstado: toOptionalNumber(values.idEstado) ?? idEstadoActivo.value ?? undefined,
        idProductoRegulador: productoId,
        idProductoStock,
      })

      const garantia = montoGarantiaNum.value
      if (garantia > 0) {
        try {
          await garantiasService.crear({
            idUsuarioAuditoria: currentUserId,
            idCliente: cliente,
            monto: garantia,
            idAlquiler: created.id,
            idProducto: productoId,
            idComprobante: values.idComprobanteVenta
              ? Number(values.idComprobanteVenta)
              : undefined,
            fechaRegistro: values.fechaInicio,
            idMedioPago: Number(idMedioPagoGarantia.value),
            idCuentaBancaria: idCuentaBancariaGarantia.value ?? undefined,
            numeroOperacion: numeroOperacionGarantia.value.trim() || undefined,
            observacion:
              observacionGarantia.value.trim() ||
              `Garantía alquiler ${created.numero_alquiler || created.id}`,
          })
        } catch (error) {
          toastApiError(
            error,
            'Alquiler creado, pero falló el registro de la garantía',
          )
        }
      }

      activeAlquilerId.value = created.id
      internalMode.value = 'edit'
      const payload: AlquilerFormSavedPayload = { id: created.id }
      emit('created', payload)
      emit('saved', payload)
    } else if (activeAlquilerId.value) {
      await updateMutation.mutateAsync({
        id: activeAlquilerId.value,
        payload: {
          idUsuarioAuditoria: currentUserId,
          ...fields,
        },
      })
      emit('saved', { id: activeAlquilerId.value })
    } else {
      return
    }
  } catch {
    // toast en mutation
  }
})


watch(
  () => [props.active, props.mode, props.alquilerId] as const,
  ([isActive, mode, alquilerId]) => {
    if (!isActive) return

    // After create→edit (FormView replace), keep current form state.
    if (
      mode === 'edit' &&
      alquilerId &&
      activeAlquilerId.value === alquilerId &&
      internalMode.value === 'edit'
    ) {
      return
    }

    resetFormState()
    if (mode === 'edit' && alquilerId) {
      syncFormValues()
    } else {
      resetCreateForm()
    }
  },
  { immediate: true },
)

watch(
  () => alquilerQuery.data.value,
  () => {
    if (props.active && activeAlquilerId.value) {
      syncFormValues()
    }
  },
)

watch(idProductoRegulador, (value) => {
  if (!isCreateMode.value) return
  const id = Number(value)
  if (!id) {
    montoGarantia.value = '0.00'
    idMedioPagoGarantia.value = ''
    idCuentaBancariaGarantia.value = null
    numeroOperacionGarantia.value = ''
    observacionGarantia.value = ''
    return
  }
  void prefillMontoGarantia(id)
})

watch(idAlmacen, (nuevo, anterior) => {
  if (!isCreateMode.value) return
  if (nuevo === anterior) return
  idProductoRegulador.value = ''
  montoGarantia.value = '0.00'
  idMedioPagoGarantia.value = ''
  idCuentaBancariaGarantia.value = null
  numeroOperacionGarantia.value = ''
  observacionGarantia.value = ''
})
</script>
