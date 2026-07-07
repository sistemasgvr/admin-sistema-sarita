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
      class="space-y-5"
      autocomplete="off"
      @submit="onSubmit"
    >
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

      <AppSelect
        v-model="idProducto"
        label="Producto asociado"
        placeholder="Opcional"
        v-bind="idProductoAttrs"
        :disabled="isSubmitting"
        :options="productoOptions"
      />

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
          min="0"
          step="0.0001"
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

      <div class="grid grid-cols-1 gap-4 border-t border-gray-200 pt-4 sm:grid-cols-2 dark:border-gray-800">
        <AppInput
          v-model="costoProducto"
          label="Costo producto"
          type="number"
          min="0"
          step="0.01"
          v-bind="costoProductoAttrs"
          :disabled="isSubmitting"
        />

        <AppInput
          v-model="costoFlete"
          label="Costo flete"
          type="number"
          min="0"
          step="0.01"
          v-bind="costoFleteAttrs"
          :disabled="isSubmitting"
        />

        <AppInput
          v-model="porcentajeMargen"
          label="Margen %"
          type="number"
          min="0"
          step="0.01"
          v-bind="porcentajeMargenAttrs"
          :disabled="isSubmitting"
        />

        <AppInput
          v-model="precioFinal"
          label="Precio final"
          type="number"
          min="0"
          step="0.01"
          v-bind="precioFinalAttrs"
          :disabled="isSubmitting"
        />

        <AppInput
          v-model="precioGarantia"
          label="Precio garantía"
          type="number"
          min="0"
          step="0.01"
          v-bind="precioGarantiaAttrs"
          :disabled="isSubmitting"
        />
      </div>
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
import { AppInput, AppModal, AppSelect } from '@/shared/components'
import { ListaIds } from '@/shared/constants/lista-ids'
import { optionalNumber, optionalString, requiredString } from '@/shared/validation'

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

const productoOptions = computed(() => [
  { value: '', label: 'Sin producto' },
  ...props.productos.map((producto) => ({
    value: producto.id,
    label: `${producto.codigo} — ${producto.nombre}`,
  })),
])

const unidadMedidaOptions = computed(() => [
  { value: '', label: 'Sin unidad' },
  ...(unidadesMedidaQuery.data.value ?? []).map((opcion) => ({
    value: opcion.id,
    label: opcion.nombre,
  })),
])

const { defineField, handleSubmit, resetForm, errors, isSubmitting } = useForm({
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
      costoProducto: optionalNumber().min(0, 'No puede ser negativo'),
      costoFlete: optionalNumber().min(0, 'No puede ser negativo'),
      porcentajeMargen: optionalNumber().min(0, 'No puede ser negativo'),
      precioFinal: optionalNumber().min(0, 'No puede ser negativo'),
      precioGarantia: optionalNumber().min(0, 'No puede ser negativo'),
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
    costoProducto: 0,
    costoFlete: 0,
    porcentajeMargen: undefined as number | undefined,
    precioFinal: undefined as number | undefined,
    precioGarantia: undefined as number | undefined,
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
  costoProducto?: number
  costoFlete?: number
  porcentajeMargen?: number
  precioFinal?: number
  precioGarantia?: number
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
  costoProducto: values.costoProducto ?? 0,
  costoFlete: values.costoFlete ?? 0,
  porcentajeMargen: values.porcentajeMargen ?? undefined,
  precioFinal: values.precioFinal ?? undefined,
  precioGarantia: values.precioGarantia ?? undefined,
})

const syncFormValues = () => {
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
      costoProducto: props.catalogoPrecio?.costo_producto ?? 0,
      costoFlete: props.catalogoPrecio?.costo_flete ?? 0,
      porcentajeMargen: props.catalogoPrecio?.porcentaje_margen ?? undefined,
      precioFinal: props.catalogoPrecio?.precio_final ?? undefined,
      precioGarantia: props.catalogoPrecio?.precio_garantia ?? undefined,
    },
  })
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
