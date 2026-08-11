<template>
  <div>
    <form
      v-if="!isLoadingBalon"
      id="balon-form"
      class="space-y-5"
      autocomplete="off"
      @submit="onSubmit"
    >
      <FormCardsLayout>
        <DetailSectionCard title="Identificación" :icon="ICONS.idCard" :full-width="true">
          <div class="space-y-5">
            <div class="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <AppInput
                v-model="codigoBalon"
                label="Código de balón"
                placeholder="20K650076"
                required
                v-bind="codigoBalonAttrs"
                :disabled="isSubmitting || isLoadingBalon"
                :error="errors.codigoBalon"
              />
              <AppInput
                v-model="numeroSerie"
                label="Número de serie"
                placeholder="Igual al código si no difiere"
                v-bind="numeroSerieAttrs"
                :disabled="isSubmitting || isLoadingBalon"
                :error="errors.numeroSerie"
              />
            </div>
            <div class="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <AppSelect
                v-model="idMarcaCilindro"
                label="Marca"
                :placeholder="marcaQuery.isLoading.value ? 'Cargando...' : 'Selecciona...'"
                :options="marcaOptions"
                :disabled="isSubmitting || marcaQuery.isLoading.value"
                v-bind="idMarcaCilindroAttrs"
                :error="errors.idMarcaCilindro"
              />
              <AppInput
                v-model="numeroRecepcion"
                label="Número de recepción"
                v-bind="numeroRecepcionAttrs"
                :disabled="isSubmitting || isLoadingBalon"
                :error="errors.numeroRecepcion"
              />
            </div>
            <div class="grid grid-cols-1 gap-5 sm:grid-cols-3 lg:grid-cols-3">
              <AppInput
                v-model="libroCilindro"
                label="Libro cilindro"
                placeholder="LIBRO 1"
                v-bind="libroCilindroAttrs"
                :disabled="isSubmitting || isLoadingBalon"
                :error="errors.libroCilindro"
              />
              <AppInput
                v-model="paginaLibro"
                label="Página"
                type="number"
                min="0"
                v-bind="paginaLibroAttrs"
                :disabled="isSubmitting || isLoadingBalon"
                :error="errors.paginaLibro"
              />
              <AppInput
                v-model="fechaRegistro"
                label="Fecha registro"
                type="date"
                v-bind="fechaRegistroAttrs"
                :disabled="isSubmitting || isLoadingBalon"
                :error="errors.fechaRegistro"
              />
            </div>
          </div>
        </DetailSectionCard>

        <DetailSectionCard title="Clasificación" :icon="ICONS.layers" :full-width="true">
          <div class="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <TipoBalonSelectField
              v-model="idTipoBalon"
              label="Tipo de balón"
              placeholder="Selecciona..."
              required
              :disabled="isSubmitting"
              v-bind="idTipoBalonAttrs"
              :error="errors.idTipoBalon"
              @created="onTipoBalonCreated"
            />
            <ProductoSelectField
              v-model="idProductoGas"
              label="Gas (producto)"
              placeholder="Selecciona..."
              :es-gas="true"
              :searchable="false"
              required
              :disabled="isSubmitting"
              v-bind="idProductoGasAttrs"
              :error="errors.idProductoGas"
            />
            <AppSelect
              v-model="idEstadoBalon"
              label="Estado del balón"
              :placeholder="estadoBalonQuery.isLoading.value ? 'Cargando...' : 'Selecciona...'"
              :options="estadoBalonOptions"
              :disabled="isSubmitting || estadoBalonQuery.isLoading.value"
              v-bind="idEstadoBalonAttrs"
              :error="errors.idEstadoBalon"
            />
            <AppSelect
              v-model="idEstadoContenido"
              label="Contenido"
              :placeholder="
                estadoContenidoQuery.isLoading.value ? 'Cargando...' : 'Lleno / vacío...'
              "
              :options="estadoContenidoOptions"
              :disabled="isSubmitting || estadoContenidoQuery.isLoading.value"
              v-bind="idEstadoContenidoAttrs"
              :error="errors.idEstadoContenido"
            />
            <AppSelect
              v-model="idReferencia"
              label="Referencia"
              :placeholder="referenciaQuery.isLoading.value ? 'Cargando...' : 'Selecciona...'"
              :options="referenciaOptions"
              :disabled="isSubmitting || referenciaQuery.isLoading.value"
              v-bind="idReferenciaAttrs"
              :error="errors.idReferencia"
            />
            <ClienteSelectField
              v-model="idPlanta"
              label="Planta"
              placeholder="Opcional"
              :disabled="isSubmitting"
              :error="errors.idPlanta"
            />
          </div>
        </DetailSectionCard>

        <DetailSectionCard title="Ubicación" :icon="ICONS.mapPin" :full-width="true">
          <div class="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <AlmacenSelectField
              v-model="idAlmacen"
              :disabled="isSubmitting"
              :error="errors.idAlmacen"
            />
            <ClienteSelectField
              v-model="idClienteUbicacion"
              label="Cliente (ubicación actual)"
              placeholder="Opcional"
              :disabled="isSubmitting"
              :error="errors.idClienteUbicacion"
            />
          </div>
        </DetailSectionCard>

        <DetailSectionCard title="Propiedad del envase" :icon="ICONS.building" :full-width="true">
          <div class="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <AppSelect
              v-model="idPropietario"
              label="Propietario"
              :placeholder="propietarioQuery.isLoading.value ? 'Cargando...' : 'Selecciona...'"
              :options="propietarioOptions"
              :disabled="isSubmitting || propietarioQuery.isLoading.value"
              v-bind="idPropietarioAttrs"
              :error="errors.idPropietario"
            />
            <ClienteSelectField
              v-if="requiereClientePropietario"
              v-model="idClientePropietario"
              label="Cliente propietario"
              placeholder="Selecciona cliente"
              :disabled="isSubmitting"
              :error="errors.idClientePropietario"
            />
          </div>
        </DetailSectionCard>

        <DetailSectionCard
          title="P.H. y datos técnicos"
          :icon="ICONS.gauge"
          :full-width="true"
          help="Ingrese el mes y año grabados en el lomo; el sistema calcula el vencimiento según la vigencia del tipo (5 u 10 años). Las renovaciones se registran en Mantenimientos (P.H. / Recertificación)."
        >
          <div class="space-y-5">
            <div class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <AppSelect
                v-model="mesFabricacion"
                label="Mes fabricación (pH)"
                placeholder="Mes del lomo"
                :options="mesOptions"
                :disabled="isSubmitting || isLoadingBalon"
                v-bind="mesFabricacionAttrs"
                :error="errors.mesFabricacion"
              />
              <AppInput
                v-model="anioFabricacion"
                label="Año fabricación (pH)"
                type="number"
                min="1900"
                max="2100"
                placeholder="Ej. 2021"
                v-bind="anioFabricacionAttrs"
                :disabled="isSubmitting || isLoadingBalon"
                :error="errors.anioFabricacion"
              />
              <AppInput
                v-model="presionActual"
                label="Presión actual (PSI)"
                type="number"
                min="0"
                step="1"
                help="Estado de llenado. No confundir con libras de masa (báscula)."
                v-bind="presionActualAttrs"
                :disabled="isSubmitting || isLoadingBalon"
                :error="errors.presionActual"
              />
              <div
                class="flex flex-col justify-end rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm dark:border-gray-700 dark:bg-white/[0.03]"
              >
                <span class="text-theme-xs text-gray-500 dark:text-gray-400">
                  Vencimiento pH estimado
                </span>
                <span class="font-medium text-gray-800 dark:text-white/90">
                  {{ vencimientoPhEstimado }}
                </span>
                <span v-if="vigenciaTipoAnios" class="text-theme-xs text-gray-500">
                  Vigencia tipo: {{ vigenciaTipoAnios }} años
                </span>
              </div>
            </div>
            <div class="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <AppSelect
                v-model="idOrganoInspector"
                label="Órgano inspector"
                :placeholder="organoInspectorQuery.isLoading.value ? 'Cargando...' : 'Selecciona...'"
                :options="organoInspectorOptions"
                :disabled="isSubmitting || organoInspectorNoAplica || organoInspectorQuery.isLoading.value"
                v-bind="idOrganoInspectorAttrs"
                :error="errors.idOrganoInspector"
              />
              <div class="flex items-end pb-2">
                <AppCheckbox
                  v-model="organoInspectorNoAplica"
                  label="Sin órgano inspector"
                  :disabled="isSubmitting"
                />
              </div>
            </div>
            <AppTextarea
              v-model="observacion"
              label="Observación"
              placeholder="Notas adicionales"
              v-bind="observacionAttrs"
              :disabled="isSubmitting || isLoadingBalon"
              :error="errors.observacion"
            />
          </div>
        </DetailSectionCard>
      </FormCardsLayout>

      <div class="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          class="flex w-full justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-white/[0.03] sm:w-auto"
          :disabled="isSubmitting || isLoadingBalon"
          @click="emit('cancel')"
        >
          Cancelar
        </button>
        <button
          type="submit"
          class="flex w-full justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
          :disabled="isSubmitting || isLoadingBalon"
        >
          {{ isSubmitting ? 'Guardando...' : mode === 'create' ? 'Registrar cilindro' : 'Guardar cambios' }}
        </button>
      </div>
    </form>

    <div v-else class="py-10 text-center text-sm text-gray-500 dark:text-gray-400">
      Cargando datos del cilindro...
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
import {
  useCreateBalonMutation,
  useUpdateBalonMutation,
} from '@/modules/balones/cilindros/composables/useBalonMutations'
import { useBalonQuery } from '@/modules/balones/cilindros/composables/useBalonesQuery'
import { useTiposBalonQuery } from '@/modules/balones/tipos-balon/composables/useTiposBalonQuery'
import TipoBalonSelectField from '@/modules/balones/tipos-balon/components/TipoBalonSelectField.vue'
import type { TipoBalon } from '@/modules/balones/tipos-balon/interfaces/tipo-balon.interface'
import type {
  Balon,
  BalonFormMode,
  BalonFormPreset,
} from '@/modules/balones/cilindros/interfaces/balon.interface'
import ProductoSelectField from '@/modules/productos/articulos/components/ProductoSelectField.vue'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import {
  addYearsMonthYear,
  formatMonthYear,
  MES_FABRICACION_OPTIONS,
  toFirstOfMonthIso,
} from '@/modules/balones/utils/formatMonthYear'
import { AppCheckbox, AppInput, AppSelect, AppTextarea } from '@/shared/components'
import DetailSectionCard from '@/shared/components/detail/DetailSectionCard.vue'
import FormCardsLayout from '@/shared/components/detail/FormCardsLayout.vue'
import { ICONS } from '@/shared/constants/icons'
import { ListaIds } from '@/shared/constants/lista-ids'
import {
  optionalNumber,
  optionalString,
  requiredSelect,
  requiredString,
} from '@/shared/validation'

interface BalonFormProps {
  mode: BalonFormMode
  balonId?: number | null
  preset?: BalonFormPreset | null
  /** When true, sync/load form. Page: always true. Modal: equals open. */
  active: boolean
}

const props = withDefaults(defineProps<BalonFormProps>(), {
  preset: null,
  balonId: null,
})

const emit = defineEmits<{
  saved: []
  created: [balon: Balon]
  cancel: []
}>()

const authStore = useAuthStore()
const createMutation = useCreateBalonMutation()
const updateMutation = useUpdateBalonMutation()

const balonIdRef = computed(() => (props.mode === 'edit' ? props.balonId : null))
const balonQuery = useBalonQuery(balonIdRef)
const isLoadingBalon = computed(
  () => props.mode === 'edit' && props.active && balonQuery.isFetching.value,
)
const balonDetalle = computed(() => balonQuery.data.value ?? null)

const tiposBalonFilters = ref({ pagina: 1, limite: 200 })
const tiposBalonQuery = useTiposBalonQuery(tiposBalonFilters)
const createdTipoBalon = ref<TipoBalon | null>(null)

const listaEstadoBalonId = ref(ListaIds.ESTADO_BALON)
const listaEstadoContenidoId = ref(ListaIds.ESTADO_CONTENIDO_BALON)
const listaReferenciaId = ref(ListaIds.REFERENCIA_CILINDRO)
const listaPropietarioId = ref(ListaIds.PROPIETARIO_BALON)
const listaMarcaId = ref(ListaIds.MARCA_CILINDRO)
const listaOrganoInspectorId = ref(ListaIds.ORGANO_INSPECTOR_CILINDRO)

const estadoBalonQuery = useListaOpcionesQuery(listaEstadoBalonId)
const estadoContenidoQuery = useListaOpcionesQuery(listaEstadoContenidoId)
const referenciaQuery = useListaOpcionesQuery(listaReferenciaId)
const propietarioQuery = useListaOpcionesQuery(listaPropietarioId)
const marcaQuery = useListaOpcionesQuery(listaMarcaId)
const organoInspectorQuery = useListaOpcionesQuery(listaOrganoInspectorId)
const mesOptions = MES_FABRICACION_OPTIONS

const estadoBalonOptions = computed(() => toSelectOptions(estadoBalonQuery.data.value))
const estadoContenidoOptions = computed(() => toSelectOptions(estadoContenidoQuery.data.value))
const referenciaOptions = computed(() => toSelectOptions(referenciaQuery.data.value))
const propietarioOptions = computed(() => toSelectOptions(propietarioQuery.data.value))
const marcaOptions = computed(() => toSelectOptions(marcaQuery.data.value))
const organoInspectorOptions = computed(() =>
  toSelectOptions(
    organoInspectorQuery.data.value?.filter(
      (opcion) => opcion.nombre?.toUpperCase() !== 'NO_APLICA',
    ),
  ),
)

const toDateInput = (value?: string | null) => (value ? value.slice(0, 10) : '')

const { defineField, handleSubmit, resetForm, errors, isSubmitting } = useForm({
  validationSchema: toTypedSchema(
    yup.object({
      codigoBalon: requiredString('El código de balón').max(50, 'Máximo 50 caracteres'),
      numeroSerie: optionalString().max(50, 'Máximo 50 caracteres'),
      libroCilindro: optionalString().max(30, 'Máximo 30 caracteres'),
      paginaLibro: optionalNumber(),
      fechaRegistro: optionalString(),
      numeroRecepcion: optionalString().max(30, 'Máximo 30 caracteres'),
      idAlmacen: optionalNumber(),
      idClienteUbicacion: optionalNumber(),
      idPropietario: optionalNumber(),
      idClientePropietario: optionalNumber(),
      idReferencia: optionalNumber(),
      idPlanta: optionalNumber(),
      idMarcaCilindro: optionalNumber(),
      idTipoBalon: requiredSelect('El tipo de balón'),
      idProductoGas: requiredSelect('El gas'),
      idEstadoBalon: optionalNumber(),
      idEstadoContenido: optionalNumber(),
      idOrganoInspector: optionalNumber(),
      organoInspectorNoAplica: yup.boolean().optional(),
      mesFabricacion: optionalNumber(),
      anioFabricacion: optionalNumber(),
      presionActual: optionalNumber(),
      observacion: optionalString().max(500, 'Máximo 500 caracteres'),
    }),
  ),
  initialValues: {
    codigoBalon: '',
    numeroSerie: '',
    libroCilindro: '',
    paginaLibro: undefined as number | undefined,
    fechaRegistro: '',
    numeroRecepcion: '',
    idAlmacen: undefined as number | undefined,
    idClienteUbicacion: undefined as number | undefined,
    idPropietario: undefined as number | undefined,
    idClientePropietario: undefined as number | undefined,
    idReferencia: undefined as number | undefined,
    idPlanta: undefined as number | undefined,
    idMarcaCilindro: undefined as number | undefined,
    idTipoBalon: undefined as number | undefined,
    idProductoGas: undefined as number | undefined,
    idEstadoBalon: undefined as number | undefined,
    idEstadoContenido: undefined as number | undefined,
    idOrganoInspector: undefined as number | undefined,
    organoInspectorNoAplica: false,
    mesFabricacion: undefined as number | undefined,
    anioFabricacion: undefined as number | undefined,
    presionActual: undefined as number | undefined,
    observacion: '',
  },
})

const [codigoBalon, codigoBalonAttrs] = defineField('codigoBalon')
const [numeroSerie, numeroSerieAttrs] = defineField('numeroSerie')
const [libroCilindro, libroCilindroAttrs] = defineField('libroCilindro')
const [paginaLibro, paginaLibroAttrs] = defineField('paginaLibro')
const [fechaRegistro, fechaRegistroAttrs] = defineField('fechaRegistro')
const [numeroRecepcion, numeroRecepcionAttrs] = defineField('numeroRecepcion')
const [idAlmacen] = defineField('idAlmacen')
const [idClienteUbicacion] = defineField('idClienteUbicacion')
const [idPropietario, idPropietarioAttrs] = defineField('idPropietario')
const [idClientePropietario] = defineField('idClientePropietario')
const [idReferencia, idReferenciaAttrs] = defineField('idReferencia')
const [idPlanta] = defineField('idPlanta')
const [idMarcaCilindro, idMarcaCilindroAttrs] = defineField('idMarcaCilindro')
const [idTipoBalon, idTipoBalonAttrs] = defineField('idTipoBalon')
const [idProductoGas, idProductoGasAttrs] = defineField('idProductoGas')
const [idEstadoBalon, idEstadoBalonAttrs] = defineField('idEstadoBalon')
const [idEstadoContenido, idEstadoContenidoAttrs] = defineField('idEstadoContenido')
const [idOrganoInspector, idOrganoInspectorAttrs] = defineField('idOrganoInspector')
const [organoInspectorNoAplica] = defineField('organoInspectorNoAplica')
const [mesFabricacion, mesFabricacionAttrs] = defineField('mesFabricacion')
const [anioFabricacion, anioFabricacionAttrs] = defineField('anioFabricacion')
const [presionActual, presionActualAttrs] = defineField('presionActual')
const [observacion, observacionAttrs] = defineField('observacion')

const propietarioSeleccionado = computed(() =>
  propietarioQuery.data.value?.find((opcion) => opcion.id === Number(idPropietario.value)),
)

const requiereClientePropietario = computed(
  () => propietarioSeleccionado.value?.nombre?.toUpperCase() === 'CLIENTE',
)

const tipoSeleccionado = computed(() => {
  const id = Number(idTipoBalon.value)
  if (!id) return undefined
  if (createdTipoBalon.value?.id === id) return createdTipoBalon.value
  return (tiposBalonQuery.data.value?.data ?? []).find((tipo) => tipo.id === id)
})

function onTipoBalonCreated(tipo: TipoBalon) {
  createdTipoBalon.value = tipo
  if (tipo.id_gas) {
    idProductoGas.value = tipo.id_gas
  }
  void tiposBalonQuery.refetch()
}

watch(idTipoBalon, (id) => {
  const tipo = (tiposBalonQuery.data.value?.data ?? []).find((t) => t.id === Number(id))
  if (tipo?.id_gas) {
    idProductoGas.value = tipo.id_gas
  }
})

const vigenciaTipoAnios = computed(
  () => tipoSeleccionado.value?.vigencia_ph_anios ?? undefined,
)

const vencimientoPhEstimado = computed(() => {
  const years = vigenciaTipoAnios.value ?? 5
  const next = addYearsMonthYear(
    mesFabricacion.value != null ? Number(mesFabricacion.value) : null,
    anioFabricacion.value != null ? Number(anioFabricacion.value) : null,
    years,
  )
  if (!next) return '—'
  return formatMonthYear(null, next.mes, next.anio)
})

watch(idPropietario, () => {
  if (!requiereClientePropietario.value) {
    idClientePropietario.value = undefined
  }
})

watch(organoInspectorNoAplica, (noAplica) => {
  if (noAplica) idOrganoInspector.value = undefined
})

watch(codigoBalon, (codigo) => {
  if (props.mode === 'create' && codigo && !numeroSerie.value) {
    numeroSerie.value = codigo
  }
})

const buildPayload = (
  values: {
    codigoBalon: string
    numeroSerie: string
    libroCilindro: string
    paginaLibro?: number
    fechaRegistro: string
    numeroRecepcion: string
    idAlmacen?: number
    idClienteUbicacion?: number
    idPropietario?: number
    idClientePropietario?: number
    idReferencia?: number
    idPlanta?: number
    idMarcaCilindro?: number
    idTipoBalon: number | string
    idProductoGas: number | string
    idEstadoBalon?: number
    idEstadoContenido?: number
    idOrganoInspector?: number
    organoInspectorNoAplica?: boolean
    mesFabricacion?: number
    anioFabricacion?: number
    presionActual?: number
    observacion: string
  },
  userId: number,
) => {
  const mes = values.mesFabricacion != null ? Number(values.mesFabricacion) : undefined
  const anio = values.anioFabricacion != null ? Number(values.anioFabricacion) : undefined

  return {
    idUsuarioAuditoria: userId,
    codigoBalon: values.codigoBalon,
    numeroSerie: values.numeroSerie || values.codigoBalon || undefined,
    libroCilindro: values.libroCilindro || undefined,
    paginaLibro: values.paginaLibro,
    fechaRegistro: values.fechaRegistro || undefined,
    numeroRecepcion: values.numeroRecepcion || undefined,
    idAlmacen: values.idAlmacen,
    idClienteUbicacion: values.idClienteUbicacion,
    idPropietario: values.idPropietario,
    idClientePropietario: requiereClientePropietario.value ? values.idClientePropietario : undefined,
    idReferencia: values.idReferencia,
    idPlanta: values.idPlanta,
    idMarcaCilindro: values.idMarcaCilindro,
    idTipoBalon: Number(values.idTipoBalon),
    idProductoGas: Number(values.idProductoGas),
    idEstadoBalon: values.idEstadoBalon,
    idEstadoContenido: values.idEstadoContenido,
    idOrganoInspector: values.organoInspectorNoAplica ? undefined : values.idOrganoInspector,
    organoInspectorNoAplica: values.organoInspectorNoAplica ?? false,
    fechaFabricacion: toFirstOfMonthIso(mes, anio),
    mesFabricacion: mes,
    anioFabricacion: anio,
    vigenciaPruebaHidrostaticaAnios: vigenciaTipoAnios.value,
    presionActual: values.presionActual,
    observacion: values.observacion || undefined,
  }
}

const syncFormValues = () => {
  const data = balonDetalle.value
  const mesFromDate =
    data?.mes_fabricacion ??
    (data?.fecha_fabricacion ? Number(data.fecha_fabricacion.slice(5, 7)) : undefined)

  resetForm({
    values: {
      codigoBalon: data?.codigo_balon ?? '',
      numeroSerie: data?.numero_serie ?? '',
      libroCilindro: data?.libro_cilindro ?? '',
      paginaLibro: data?.pagina_libro ?? undefined,
      fechaRegistro: toDateInput(data?.fecha_registro),
      numeroRecepcion: data?.numero_recepcion ?? '',
      idAlmacen: data?.id_almacen ?? undefined,
      idClienteUbicacion: data?.id_cliente_ubicacion ?? undefined,
      idPropietario: data?.id_propietario ?? undefined,
      idClientePropietario: data?.id_cliente_propietario ?? undefined,
      idReferencia: data?.id_referencia ?? undefined,
      idPlanta: data?.id_planta ?? undefined,
      idMarcaCilindro: data?.id_marca_cilindro ?? undefined,
      idTipoBalon: data?.id_tipo_balon ?? undefined,
      idProductoGas: data?.id_producto_gas ?? undefined,
      idEstadoBalon: data?.id_estado_balon ?? undefined,
      idEstadoContenido: data?.id_estado_contenido ?? undefined,
      idOrganoInspector: data?.id_organo_inspector ?? undefined,
      organoInspectorNoAplica: data?.organo_inspector_no_aplica ?? false,
      mesFabricacion: mesFromDate,
      anioFabricacion: data?.anio_fabricacion ?? undefined,
      presionActual: data?.presion_actual ?? undefined,
      observacion: data?.observacion ?? '',
    },
  })
}

const applyCreateForm = () => {
  resetForm({
    values: {
      codigoBalon: props.preset?.codigoBalon ?? '',
      numeroSerie: props.preset?.codigoBalon ?? '',
      libroCilindro: '',
      paginaLibro: undefined,
      fechaRegistro: new Date().toISOString().slice(0, 10),
      numeroRecepcion: '',
      idAlmacen: props.preset?.idAlmacen,
      idClienteUbicacion: props.preset?.idClienteUbicacion,
      idPropietario: props.preset?.idPropietario,
      idClientePropietario: props.preset?.idClientePropietario,
      idReferencia: undefined,
      idPlanta: undefined,
      idMarcaCilindro: undefined,
      idTipoBalon: undefined,
      idProductoGas: undefined,
      idEstadoBalon: props.preset?.idEstadoBalon,
      idEstadoContenido: undefined,
      idOrganoInspector: undefined,
      organoInspectorNoAplica: false,
      mesFabricacion: undefined,
      anioFabricacion: undefined,
      presionActual: undefined,
      observacion: '',
    },
  })
}

const onSubmit = handleSubmit(async (values) => {
  const currentUserId = authStore.user?.id
  if (!currentUserId) return

  if (values.idTipoBalon == null || values.idTipoBalon === '') return
  if (values.idProductoGas == null || values.idProductoGas === '') return

  const payload = buildPayload(
    {
      ...values,
      idTipoBalon: values.idTipoBalon,
      idProductoGas: values.idProductoGas,
      numeroSerie: values.numeroSerie ?? '',
      libroCilindro: values.libroCilindro ?? '',
      fechaRegistro: values.fechaRegistro ?? '',
      numeroRecepcion: values.numeroRecepcion ?? '',
      observacion: values.observacion ?? '',
    },
    currentUserId,
  )

  try {
    if (props.mode === 'create') {
      const created = await createMutation.mutateAsync(payload)
      emit('created', created)
    } else if (props.balonId) {
      await updateMutation.mutateAsync({
        id: props.balonId,
        payload,
      })
    } else {
      return
    }

    emit('saved')
  } catch {
    // toast en mutation
  }
})

watch(
  () => [props.active, props.preset, props.mode] as const,
  ([isActive, , mode]) => {
    if (!isActive) return

    if (mode === 'create') {
      applyCreateForm()
    } else {
      syncFormValues()
    }
  },
  { immediate: true },
)

watch(balonDetalle, () => {
  if (props.active && props.mode === 'edit') {
    syncFormValues()
  }
})
</script>
