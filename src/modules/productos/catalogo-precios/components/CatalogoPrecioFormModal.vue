<template>
  <AppModal
    v-model="open"
    :title="mode === 'create' ? 'Nuevo ítem de catálogo' : 'Editar ítem de catálogo'"
    :subtitle="
      mode === 'create'
        ? 'Define precios de recargas, garantías o accesorios.'
        : 'Actualiza los datos comerciales del ítem seleccionado.'
    "
    size="lg"
    @close="handleClose"
  >
    <form
      id="catalogo-precio-form"
      autocomplete="off"
      @submit="onSubmit"
    >
      <FormCardsLayout>
        <DetailSectionCard title="Identificación" :icon="ICONS.clipboardList">
          <div class="space-y-4">
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <AppSelect
                v-model="idTipoCatalogo"
                label="Tipo de catálogo"
                placeholder="Selecciona tipo"
                required
                v-bind="idTipoCatalogoAttrs"
                :disabled="isSubmitting || tiposCatalogoQuery.isFetching.value"
                :error="errors.idTipoCatalogo"
                :options="tipoCatalogoOptions"
              />

              <AppInput
                v-model="periodo"
                label="Periodo"
                placeholder="2026-Q2"
                v-bind="periodoAttrs"
                :disabled="isSubmitting"
              />
            </div>

            <AppInput
              v-model="nombreItem"
              label="Nombre del ítem"
              placeholder="Recarga Oxígeno Industrial 10 m³"
              required
              v-bind="nombreItemAttrs"
              :disabled="isSubmitting"
              :error="errors.nombreItem"
            />
          </div>
        </DetailSectionCard>

        <DetailSectionCard title="Producto y presentación" :icon="ICONS.package">
          <div class="space-y-4">
            <div class="flex items-end gap-2">
              <div class="min-w-0 flex-1">
                <AppSelect
                  v-model="idProducto"
                  label="Producto asociado"
                  placeholder="Opcional"
                  v-bind="idProductoAttrs"
                  :disabled="isSubmitting"
                  :options="productoOptions"
                />
              </div>
              <ProductoBarcodeScanButton
                :filters="scanFiltersProducto"
                :disabled="isSubmitting"
                @scanned="onProductoScanned"
              />
            </div>
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <AppInput
                v-model="clasificacion"
                label="Clasificación"
                placeholder="Industrial, Soldadura..."
                v-bind="clasificacionAttrs"
                :disabled="isSubmitting"
              />

              <AppInput
                v-model="modelo"
                label="Modelo"
                placeholder="Cilindro 10 m³"
                v-bind="modeloAttrs"
                :disabled="isSubmitting"
              />
            </div>

            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <AppInput
                v-model="capacidad"
                label="Capacidad"
                type="number"
                :min="NUMBER_MIN.measure"
                :step="NUMBER_STEP.measure"
                v-bind="capacidadAttrs"
                :disabled="isSubmitting"
              />

              <AppSelect
                v-model="idUnidadMedida"
                label="Unidad de medida"
                placeholder="Opcional"
                v-bind="idUnidadMedidaAttrs"
                :disabled="isSubmitting || unidadesMedidaQuery.isFetching.value"
                :options="unidadMedidaOptions"
              />
            </div>

            <AppInput
              v-model="descripcionPresentacion"
              label="Presentación"
              placeholder="Descripción comercial"
              v-bind="descripcionPresentacionAttrs"
              :disabled="isSubmitting"
            />
          </div>
        </DetailSectionCard>

        <DetailSectionCard title="Precios" :icon="ICONS.creditCard" :full-width="true">
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <AppFormField label="Costo producto" :error="errors.costoProducto">
              <MoneyInput
                v-model="costoProducto"
                v-bind="costoProductoAttrs"
                placeholder="0.00"
                :disabled="isSubmitting"
                :state="errors.costoProducto ? 'error' : 'default'"
                @blur="onMoneyBlur('costoProducto', costoProductoAttrs.onBlur)"
              />
            </AppFormField>

            <AppFormField label="Costo flete" :error="errors.costoFlete">
              <MoneyInput
                v-model="costoFlete"
                v-bind="costoFleteAttrs"
                placeholder="0.00"
                :disabled="isSubmitting"
                :state="errors.costoFlete ? 'error' : 'default'"
                @blur="onMoneyBlur('costoFlete', costoFleteAttrs.onBlur)"
              />
            </AppFormField>

            <AppInput
              v-model="porcentajeMargen"
              label="Margen %"
              type="number"
              :min="NUMBER_MIN.money"
              :step="NUMBER_STEP.money"
              v-bind="porcentajeMargenAttrs"
              :disabled="isSubmitting"
            />

            <AppFormField label="Precio final" :error="errors.precioFinal">
              <MoneyInput
                v-model="precioFinal"
                v-bind="precioFinalAttrs"
                placeholder="0.00"
                :disabled="isSubmitting"
                :state="errors.precioFinal ? 'error' : 'default'"
                @blur="onMoneyBlur('precioFinal', precioFinalAttrs.onBlur)"
              />
            </AppFormField>

            <AppFormField label="Precio garantía" :error="errors.precioGarantia">
              <MoneyInput
                v-model="precioGarantia"
                v-bind="precioGarantiaAttrs"
                placeholder="0.00"
                :disabled="isSubmitting"
                :state="errors.precioGarantia ? 'error' : 'default'"
                @blur="onMoneyBlur('precioGarantia', precioGarantiaAttrs.onBlur)"
              />
            </AppFormField>
          </div>
        </DetailSectionCard>
      </FormCardsLayout>
    </form>

    <template #footer>
      <button
        type="button"
        class="flex w-full justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-white/[0.03] sm:w-auto"
        :disabled="isSubmitting"
        @click="handleClose"
      >
        Cancelar
      </button>
      <button
        type="submit"
        form="catalogo-precio-form"
        class="flex w-full justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
        :disabled="isSubmitting"
      >
        {{ isSubmitting ? 'Guardando...' : mode === 'create' ? 'Crear ítem' : 'Guardar cambios' }}
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
import {
  useCreateCatalogoPrecioMutation,
  useUpdateCatalogoPrecioMutation,
} from '@/modules/productos/catalogo-precios/composables/useCatalogoPrecioMutations'
import type {
  CatalogoPrecio,
  CatalogoPrecioFormMode,
} from '@/modules/productos/catalogo-precios/interfaces/catalogo-precio.interface'
import type { Producto } from '@/modules/productos/articulos/interfaces/producto.interface'
import ProductoBarcodeScanButton from '@/modules/productos/articulos/components/ProductoBarcodeScanButton.vue'
import { AppFormField, AppInput, AppModal, AppSelect, MoneyInput } from '@/shared/components'
import DetailSectionCard from '@/shared/components/detail/DetailSectionCard.vue'
import FormCardsLayout from '@/shared/components/detail/FormCardsLayout.vue'
import { ICONS } from '@/shared/constants/icons'
import { NUMBER_MIN, NUMBER_STEP } from '@/shared/constants/number-input'
import { ListaIds } from '@/shared/constants/lista-ids'
import { optionalNumber, optionalString, requiredString } from '@/shared/validation'
import {
  mensajeErrorMontoMoneda,
  parseMoneyInput,
  roundMoney,
} from '@/shared/utils/currency'
import { yupMontoMoneda } from '@/shared/utils/yupMoney'
import { toastSuccess } from '@/shared/composables/useToast'

type MoneyField = 'costoProducto' | 'costoFlete' | 'precioFinal' | 'precioGarantia'

const moneyFieldOpts = { min: 0, allowZero: true } as const

interface CatalogoPrecioFormModalProps {
  mode: CatalogoPrecioFormMode
  catalogoPrecio?: CatalogoPrecio | null
  productos: Producto[]
}

const props = defineProps<CatalogoPrecioFormModalProps>()

const open = defineModel<boolean>({ default: false })

const emit = defineEmits<{
  saved: []
}>()

const listaTipoCatalogoId = ref(ListaIds.TIPO_CATALOGO_PRECIO)
const listaUnidadMedidaId = ref(ListaIds.UNIDAD_MEDIDA)
const tiposCatalogoQuery = useListaOpcionesQuery(listaTipoCatalogoId)
const unidadesMedidaQuery = useListaOpcionesQuery(listaUnidadMedidaId)

const createMutation = useCreateCatalogoPrecioMutation()
const updateMutation = useUpdateCatalogoPrecioMutation()

const tipoCatalogoOptions = computed(() =>
  (tiposCatalogoQuery.data.value ?? []).map((opcion) => ({
    value: opcion.id,
    label: opcion.nombre,
  })),
)

const productoEscaneado = ref<Producto | null>(null)
const scanFiltersProducto = { soloActivos: 1 as const }

const productoOptions = computed(() => {
  const base = props.productos.map((producto) => ({
    value: producto.id,
    label: `${producto.codigo} — ${producto.nombre}`,
  }))
  const extra = productoEscaneado.value
  if (extra && !base.some((item) => item.value === extra.id)) {
    return [
      { value: '', label: 'Sin producto' },
      { value: extra.id, label: `${extra.codigo} — ${extra.nombre}` },
      ...base,
    ]
  }
  return [{ value: '', label: 'Sin producto' }, ...base]
})

const unidadMedidaOptions = computed(() => [
  { value: '', label: 'Sin unidad' },
  ...(unidadesMedidaQuery.data.value ?? []).map((opcion) => ({
    value: opcion.id,
    label: opcion.nombre,
  })),
])

const { defineField, handleSubmit, resetForm, errors, isSubmitting, values, setFieldValue } = useForm({
  validationSchema: toTypedSchema(
    yup.object({
      idTipoCatalogo: yup.number().required('El tipo de catálogo es obligatorio'),
      periodo: optionalString(),
      nombreItem: requiredString('El nombre del ítem'),
      idProducto: yup
        .mixed<string | number>()
        .transform((value) => (value === '' ? undefined : value))
        .optional(),
      clasificacion: optionalString(),
      modelo: optionalString(),
      capacidad: optionalNumber().min(0, 'La capacidad no puede ser negativa'),
      idUnidadMedida: yup
        .mixed<string | number>()
        .transform((value) => (value === '' ? undefined : value))
        .optional(),
      descripcionPresentacion: optionalString(),
      costoProducto: yupMontoMoneda({ optional: true, ...moneyFieldOpts }),
      costoFlete: yupMontoMoneda({ optional: true, ...moneyFieldOpts }),
      porcentajeMargen: optionalNumber().min(0, 'No puede ser negativo'),
      precioFinal: yupMontoMoneda({ optional: true, ...moneyFieldOpts }),
      precioGarantia: yupMontoMoneda({ optional: true, ...moneyFieldOpts }),
    }),
  ),
  initialValues: {
    idTipoCatalogo: undefined as number | undefined,
    periodo: '',
    nombreItem: '',
    idProducto: '' as string | number,
    clasificacion: '',
    modelo: '',
    capacidad: undefined as number | undefined,
    idUnidadMedida: '' as string | number,
    descripcionPresentacion: '',
    costoProducto: '0.00',
    costoFlete: '0.00',
    porcentajeMargen: undefined as number | undefined,
    precioFinal: '',
    precioGarantia: '',
  },
})

const [idTipoCatalogo, idTipoCatalogoAttrs] = defineField('idTipoCatalogo')
const [periodo, periodoAttrs] = defineField('periodo')
const [nombreItem, nombreItemAttrs] = defineField('nombreItem')
const [idProducto, idProductoAttrs] = defineField('idProducto')
const [clasificacion, clasificacionAttrs] = defineField('clasificacion')
const [modelo, modeloAttrs] = defineField('modelo')
const [capacidad, capacidadAttrs] = defineField('capacidad')
const [idUnidadMedida, idUnidadMedidaAttrs] = defineField('idUnidadMedida')
const [descripcionPresentacion, descripcionPresentacionAttrs] = defineField('descripcionPresentacion')
const [costoProducto, costoProductoAttrs] = defineField('costoProducto')
const [costoFlete, costoFleteAttrs] = defineField('costoFlete')
const [porcentajeMargen, porcentajeMargenAttrs] = defineField('porcentajeMargen')
const [precioFinal, precioFinalAttrs] = defineField('precioFinal')
const [precioGarantia, precioGarantiaAttrs] = defineField('precioGarantia')

function formatMoneyField(value?: number | null): string {
  if (value == null) return ''
  return roundMoney(value).toFixed(2)
}

function onMoneyBlur(field: MoneyField, veeBlur?: (e: Event) => void) {
  const raw = values[field] ?? ''
  const texto = String(raw).trim()
  if (!texto) {
    setFieldValue(field, '')
  } else if (!mensajeErrorMontoMoneda(texto, moneyFieldOpts)) {
    const n = parseMoneyInput(texto)
    if (n != null) setFieldValue(field, roundMoney(n).toFixed(2))
  }
  veeBlur?.(new Event('blur'))
}

function parseOptionalMoneyField(raw?: string): number | undefined {
  const texto = String(raw ?? '').trim()
  if (!texto) return undefined
  return roundMoney(parseMoneyInput(texto) ?? 0)
}

const buildPayload = (values: {
  idTipoCatalogo?: number
  periodo?: string
  nombreItem: string
  idProducto?: string | number
  clasificacion?: string
  modelo?: string
  capacidad?: number
  idUnidadMedida?: string | number
  descripcionPresentacion?: string
  costoProducto?: string
  costoFlete?: string
  porcentajeMargen?: number
  precioFinal?: string
  precioGarantia?: string
}) => ({
  idTipoCatalogo: Number(values.idTipoCatalogo),
  nombreItem: values.nombreItem,
  periodo: values.periodo || undefined,
  idProducto: values.idProducto ? Number(values.idProducto) : undefined,
  clasificacion: values.clasificacion || undefined,
  modelo: values.modelo || undefined,
  capacidad: values.capacidad ?? undefined,
  idUnidadMedida: values.idUnidadMedida ? Number(values.idUnidadMedida) : undefined,
  descripcionPresentacion: values.descripcionPresentacion || undefined,
  costoProducto: roundMoney(parseMoneyInput(values.costoProducto) ?? 0),
  costoFlete: roundMoney(parseMoneyInput(values.costoFlete) ?? 0),
  porcentajeMargen: values.porcentajeMargen ?? undefined,
  precioFinal: parseOptionalMoneyField(values.precioFinal),
  precioGarantia: parseOptionalMoneyField(values.precioGarantia),
})

const syncFormValues = () => {
  productoEscaneado.value = null
  resetForm({
    values: {
      idTipoCatalogo: props.catalogoPrecio?.id_tipo_catalogo ?? undefined,
      periodo: props.catalogoPrecio?.periodo ?? '',
      nombreItem: props.catalogoPrecio?.nombre_item ?? '',
      idProducto: props.catalogoPrecio?.id_producto ?? '',
      clasificacion: props.catalogoPrecio?.clasificacion ?? '',
      modelo: props.catalogoPrecio?.modelo ?? '',
      capacidad: props.catalogoPrecio?.capacidad ?? undefined,
      idUnidadMedida: props.catalogoPrecio?.id_unidad_medida ?? '',
      descripcionPresentacion: props.catalogoPrecio?.descripcion_presentacion ?? '',
      costoProducto: formatMoneyField(props.catalogoPrecio?.costo_producto ?? 0),
      costoFlete: formatMoneyField(props.catalogoPrecio?.costo_flete ?? 0),
      porcentajeMargen: props.catalogoPrecio?.porcentaje_margen ?? undefined,
      precioFinal: formatMoneyField(props.catalogoPrecio?.precio_final),
      precioGarantia: formatMoneyField(props.catalogoPrecio?.precio_garantia),
    },
  })
}

function onProductoScanned(producto: Producto) {
  productoEscaneado.value = producto
  setFieldValue('idProducto', producto.id)
  if (!values.nombreItem?.trim()) {
    setFieldValue('nombreItem', producto.nombre)
  }
  toastSuccess(`${producto.codigo} — ${producto.nombre}`)
}

const handleClose = () => {
  open.value = false
}

const onSubmit = handleSubmit(async (values) => {
  try {
    const payload = buildPayload(values)

    if (props.mode === 'create') {
      await createMutation.mutateAsync(payload)
    } else if (props.catalogoPrecio) {
      await updateMutation.mutateAsync({
        id: props.catalogoPrecio.id,
        payload,
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
    if (isOpen) {
      syncFormValues()
    }
  },
)

watch(
  () => props.catalogoPrecio,
  () => {
    if (open.value) {
      syncFormValues()
    }
  },
)
</script>
