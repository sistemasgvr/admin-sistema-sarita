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
        <DetailSectionCard
          title="Datos"
          :icon="ICONS.idCard"
          help="Código interno del cilindro. Si no hay serie distinta, se copia el código. El tipo sugiere el gas y define la vigencia de P.H."
        >
          <div class="grid grid-cols-1 !gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div class="flex min-w-0 items-start gap-2">
              <div class="min-w-0 flex-1">
                <AppInput
                  v-model="codigoBalon"
                  label="Código de balón"
                  placeholder="20K650076"
                  required
                  :help="
                    mode === 'create'
                      ? 'Puedes escanearlo con la pistola usando el botón de al lado.'
                      : undefined
                  "
                  v-bind="codigoBalonAttrs"
                  :disabled="isSubmitting || isLoadingBalon"
                  :error="errors.codigoBalon"
                />
              </div>
              <div class="mt-[1.625rem] shrink-0">
                <BalonBarcodeScanButton
                  v-if="mode === 'create'"
                  title="Escanear código"
                  :disabled="isSubmitting || isLoadingBalon"
                  @captured="onCodigoBalonScanned"
                />
              </div>
            </div>
            <AppInput
              v-model="numeroSerie"
              label="Número de serie"
              optional
              placeholder="Igual al código si no difiere"
              v-bind="numeroSerieAttrs"
              :disabled="isSubmitting || isLoadingBalon"
              :error="errors.numeroSerie"
            />
            <AppSelectWithCreate
              :can-create="canCreateListaOpcion"
              create-title="Nueva marca"
              :disabled="isSubmitting || marcaQuery.isLoading.value"
              @create="marcaModalOpen = true"
            >
              <AppSelect
                v-model="idMarcaCilindro"
                label="Marca"
                optional
                :placeholder="marcaQuery.isLoading.value ? 'Cargando...' : 'Selecciona...'"
                :options="marcaOptions"
                :disabled="isSubmitting || marcaQuery.isLoading.value"
                v-bind="idMarcaCilindroAttrs"
                :error="errors.idMarcaCilindro"
              />
            </AppSelectWithCreate>
            <AppInput
              v-model="tipoValvula"
              label="Tipo de válvula"
              optional
              placeholder="Ej. Americana, China"
              help="Origen o estilo de la válvula (p. ej. Americana, China)."
              v-bind="tipoValvulaAttrs"
              :disabled="isSubmitting || isLoadingBalon"
              :error="errors.tipoValvula"
            />
            <AppInput
              v-model="numeroRecepcion"
              label="Número de recepción"
              optional
              v-bind="numeroRecepcionAttrs"
              :disabled="isSubmitting || isLoadingBalon"
              :error="errors.numeroRecepcion"
            />
            <AppInput
              v-model="libroCilindro"
              label="Libro cilindro"
              optional
              placeholder="LIBRO 1"
              v-bind="libroCilindroAttrs"
              :disabled="isSubmitting || isLoadingBalon"
              :error="errors.libroCilindro"
            />
            <AppInput
              v-model="paginaLibro"
              label="Página"
              optional
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
            <AppSelectWithCreate
              :can-create="canCreateListaOpcion"
              create-title="Nuevo estado de cilindro"
              :disabled="isSubmitting || estadoBalonQuery.isLoading.value"
              @create="estadoBalonModalOpen = true"
            >
              <AppSelect
                v-model="idEstadoBalon"
                label="Estado del balón"
                :placeholder="estadoBalonQuery.isLoading.value ? 'Cargando...' : 'Selecciona...'"
                :options="estadoBalonOptions"
                :disabled="isSubmitting || estadoBalonQuery.isLoading.value"
                v-bind="idEstadoBalonAttrs"
                :error="errors.idEstadoBalon"
              />
            </AppSelectWithCreate>
            <AppSelectWithCreate
              :can-create="canCreateListaOpcion"
              create-title="Nuevo contenido"
              :disabled="isSubmitting || estadoContenidoQuery.isLoading.value"
              @create="contenidoModalOpen = true"
            >
              <AppSelect
                v-model="idEstadoContenido"
                label="Contenido"
                optional
                :placeholder="
                  estadoContenidoQuery.isLoading.value ? 'Cargando...' : 'Lleno / vacío...'
                "
                :options="estadoContenidoOptions"
                :disabled="isSubmitting || estadoContenidoQuery.isLoading.value"
                v-bind="idEstadoContenidoAttrs"
                :error="errors.idEstadoContenido"
              />
            </AppSelectWithCreate>
            <AppSelectWithCreate
              :can-create="canCreateListaOpcion"
              create-title="Nueva referencia"
              :disabled="isSubmitting || referenciaQuery.isLoading.value"
              @create="referenciaModalOpen = true"
            >
              <AppSelect
                v-model="idReferencia"
                label="Referencia"
                optional
                :placeholder="referenciaQuery.isLoading.value ? 'Cargando...' : 'Selecciona...'"
                :options="referenciaOptions"
                :disabled="isSubmitting || referenciaQuery.isLoading.value"
                v-bind="idReferenciaAttrs"
                :error="errors.idReferencia"
              />
            </AppSelectWithCreate>
          </div>
        </DetailSectionCard>

        <DetailSectionCard
          title="Ubicación y propiedad"
          :icon="ICONS.mapPin"
          help="Primero el dueño del envase: empresa usa almacén; cliente pide un cliente (no proveedor); planta pide el proveedor."
        >
          <div class="grid grid-cols-1 !gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <AppSelect
              v-model="idPropietario"
              label="Propietario"
              required
              :placeholder="propietarioQuery.isLoading.value ? 'Cargando...' : 'Selecciona...'"
              :options="propietarioOptions"
              :disabled="isSubmitting || propietarioQuery.isLoading.value"
              v-bind="idPropietarioAttrs"
              :error="errors.idPropietario"
            />
            <AlmacenSelectField
              v-if="muestraAlmacen"
              v-model="idAlmacen"
              :required="requiereAlmacen"
              :disabled="isSubmitting"
              :error="errors.idAlmacen"
            />
            <ClienteSelectField
              v-if="requiereClientePropietario"
              v-model="idClientePropietario"
              label="Cliente"
              placeholder="Selecciona cliente"
              help="Solo clientes. No aparecen proveedores."
              required
              solo-clientes
              :disabled="isSubmitting"
              :error="errors.idClientePropietario"
            />
            <ClienteSelectField
              v-if="requierePlantaPropietario"
              v-model="idPlanta"
              label="Proveedor (planta)"
              placeholder="Ej. Swiss Gas"
              help="Proveedor dueño del envase."
              required
              solo-proveedores
              :disabled="isSubmitting"
              :error="errors.idPlanta"
            />
          </div>
        </DetailSectionCard>

        <DetailSectionCard
          title="P.H. y datos técnicos"
          :icon="ICONS.gauge"
          help="Mes y año del lomo: el vencimiento se calcula con la vigencia del tipo (5 u 10 años). Las renovaciones van en Mantenimientos (P.H. / Recertificación)."
        >
          <div class="grid grid-cols-1 !gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <AppSelect
              v-model="mesFabricacion"
              label="Mes fabricación (pH)"
              optional
              placeholder="Mes del lomo"
              :options="mesOptions"
              :disabled="isSubmitting || isLoadingBalon"
              v-bind="mesFabricacionAttrs"
              :error="errors.mesFabricacion"
            />
            <AppInput
              v-model="anioFabricacion"
              label="Año fabricación (pH)"
              optional
              type="number"
              min="1900"
              max="2100"
              placeholder="Ej. 2021"
              v-bind="anioFabricacionAttrs"
              :disabled="isSubmitting || isLoadingBalon"
              :error="errors.anioFabricacion"
            />
            <div
              class="flex min-h-11 flex-col justify-center rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm dark:border-gray-700 dark:bg-white/[0.03] sm:mt-[1.625rem]"
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
            <AppInput
              v-model="presionActual"
              label="Presión actual (PSI)"
              optional
              type="number"
              min="0"
              step="1"
              help="Estado de llenado. No confundir con libras de masa (báscula)."
              v-bind="presionActualAttrs"
              :disabled="isSubmitting || isLoadingBalon"
              :error="errors.presionActual"
            />
            <AppInput
              v-model="pesoAproximadoKg"
              label="Peso aproximado (kg)"
              optional
              type="number"
              min="0"
              step="0.01"
              help="Peso para guías; si vacío se usa el peso del tipo"
              v-bind="pesoAproximadoKgAttrs"
              :disabled="isSubmitting || isLoadingBalon"
              :error="errors.pesoAproximadoKg"
            />
            <div class="flex items-end pb-2 sm:col-span-2 lg:col-span-3">
              <AppCheckbox
                v-model="tieneOrganoInspector"
                label="Tiene órgano inspector"
                :disabled="isSubmitting"
              />
            </div>
            <template v-if="tieneOrganoInspector">
              <AppSelectWithCreate
                :can-create="canCreateListaOpcion"
                create-title="Nuevo órgano inspector"
                :disabled="isSubmitting || organoInspectorQuery.isLoading.value"
                @create="organoModalOpen = true"
              >
                <AppSelect
                  v-model="idOrganoInspector"
                  label="Órgano inspector"
                  optional
                  :placeholder="
                    organoInspectorQuery.isLoading.value ? 'Cargando...' : 'Selecciona...'
                  "
                  :options="organoInspectorOptions"
                  :disabled="isSubmitting || organoInspectorQuery.isLoading.value"
                  v-bind="idOrganoInspectorAttrs"
                  :error="errors.idOrganoInspector"
                />
              </AppSelectWithCreate>
              <AppInput
                v-model="selloInspeccion"
                label="Sello de inspección"
                optional
                placeholder="Marca o símbolo"
                help="Marca o símbolo del sello de inspección"
                maxlength="100"
                v-bind="selloInspeccionAttrs"
                :disabled="isSubmitting || isLoadingBalon"
                :error="errors.selloInspeccion"
              />
            </template>
            <div class="sm:col-span-2 lg:col-span-3">
              <AppTextarea
                v-model="observacion"
                label="Observación"
                optional
                placeholder="Notas adicionales"
                v-bind="observacionAttrs"
                :disabled="isSubmitting || isLoadingBalon"
                :error="errors.observacion"
              />
            </div>
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

    <ListaOpcionFormModal
      v-model="marcaModalOpen"
      :id-lista="ListaIds.MARCA_CILINDRO"
      title="Nueva marca de cilindro"
      subtitle="Quedará disponible al registrar cilindros."
      nombre-placeholder="Ej. BTIC-JP"
      @saved="onMarcaCreated"
    />
    <ListaOpcionFormModal
      v-model="estadoBalonModalOpen"
      :id-lista="ListaIds.ESTADO_BALON"
      title="Nuevo estado del balón"
      subtitle="Úsalo solo si el flujo operativo lo requiere."
      nombre-placeholder="Ej. EN_ALMACEN"
      @saved="onEstadoBalonCreated"
    />
    <ListaOpcionFormModal
      v-model="contenidoModalOpen"
      :id-lista="ListaIds.ESTADO_CONTENIDO_BALON"
      title="Nuevo contenido"
      subtitle="Ej. Lleno, vacío u otro estado de contenido."
      nombre-placeholder="Ej. VACIO"
      @saved="onContenidoCreated"
    />
    <ListaOpcionFormModal
      v-model="referenciaModalOpen"
      :id-lista="ListaIds.REFERENCIA_CILINDRO"
      title="Nueva referencia"
      subtitle="Quedará disponible en la ficha del cilindro."
      nombre-placeholder="Ej. ALMACEN"
      @saved="onReferenciaCreated"
    />
    <ListaOpcionFormModal
      v-model="organoModalOpen"
      :id-lista="ListaIds.ORGANO_INSPECTOR_CILINDRO"
      title="Nuevo órgano inspector"
      subtitle="Entidad que certifica la inspección del cilindro."
      nombre-placeholder="Ej. Bureau Veritas"
      @saved="onOrganoCreated"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/yup'
import * as yup from 'yup'
import { useListaOpcionesQuery } from '@/modules/catalogos/composables/useListaOpcionesQuery'
import ListaOpcionFormModal from '@/modules/catalogos/components/ListaOpcionFormModal.vue'
import type { ListaOpcion } from '@/modules/catalogos/interfaces/lista-opcion.interface'
import { toSelectOptions } from '@/modules/catalogos/utils/toSelectOptions'
import AlmacenSelectField from '@/modules/configuracion/almacenes/components/AlmacenSelectField.vue'
import { useAlmacenesQuery } from '@/modules/configuracion/almacenes/composables/useAlmacenesQuery'
import ClienteSelectField from '@/modules/clientes/components/ClienteSelectField.vue'
import {
  useCreateBalonMutation,
  useUpdateBalonMutation,
} from '@/modules/balones/cilindros/composables/useBalonMutations'
import { useBalonQuery } from '@/modules/balones/cilindros/composables/useBalonesQuery'
import { useTiposBalonQuery } from '@/modules/balones/tipos-balon/composables/useTiposBalonQuery'
import TipoBalonSelectField from '@/modules/balones/tipos-balon/components/TipoBalonSelectField.vue'
import type { TipoBalon } from '@/modules/balones/tipos-balon/interfaces/tipo-balon.interface'
import BalonBarcodeScanButton from '@/modules/balones/cilindros/components/BalonBarcodeScanButton.vue'
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
import { AppCheckbox, AppInput, AppSelect, AppSelectWithCreate, AppTextarea } from '@/shared/components'
import DetailSectionCard from '@/shared/components/detail/DetailSectionCard.vue'
import FormCardsLayout from '@/shared/components/detail/FormCardsLayout.vue'
import { ICONS } from '@/shared/constants/icons'
import { ListaIds } from '@/shared/constants/lista-ids'
import { PermisoBanderas } from '@/shared/constants/permissions'
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

const canCreateListaOpcion = computed(() =>
  authStore.hasPermission(PermisoBanderas.BALONES_CREAR),
)

const marcaModalOpen = ref(false)
const estadoBalonModalOpen = ref(false)
const contenidoModalOpen = ref(false)
const referenciaModalOpen = ref(false)
const organoModalOpen = ref(false)

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

const almacenesFilters = ref({ pagina: 1, limite: 200 })
const almacenesQuery = useAlmacenesQuery(almacenesFilters)

const estadoBalonOptions = computed(() => toSelectOptions(estadoBalonQuery.data.value))
const estadoContenidoOptions = computed(() => toSelectOptions(estadoContenidoQuery.data.value))
const referenciaOptions = computed(() => toSelectOptions(referenciaQuery.data.value))
const propietarioOptions = computed(() => {
  const visibles = (propietarioQuery.data.value ?? []).filter((opcion) => {
    const nombre = opcion.nombre?.toUpperCase()
    if (nombre === 'EMPRESA' || nombre === 'CLIENTE' || nombre === 'PLANTA') return true
    if (nombre === 'PROPIA' && Number(idPropietario.value) === opcion.id) return true
    return false
  })
  return toSelectOptions(visibles)
})
const marcaOptions = computed(() => toSelectOptions(marcaQuery.data.value))
const organoInspectorOptions = computed(() =>
  toSelectOptions(
    organoInspectorQuery.data.value?.filter(
      (opcion) => opcion.nombre?.toUpperCase() !== 'NO_APLICA',
    ),
  ),
)

function idOpcionLista(
  opciones: { id: number; nombre: string }[] | undefined,
  nombre: string,
): number | undefined {
  return opciones?.find((opcion) => opcion.nombre?.toUpperCase() === nombre)?.id
}

function nombrePropietario(id: unknown): string {
  return (
    propietarioQuery.data.value
      ?.find((opcion) => opcion.id === Number(id))
      ?.nombre?.toUpperCase() ?? ''
  )
}

const toDateInput = (value?: string | null) => (value ? value.slice(0, 10) : '')

const { defineField, handleSubmit, resetForm, errors, isSubmitting } = useForm({
  validationSchema: toTypedSchema(
    yup.object({
      codigoBalon: requiredString('El código de balón').max(50, 'Máximo 50 caracteres'),
      numeroSerie: optionalString().max(50, 'Máximo 50 caracteres'),
      tipoValvula: optionalString().max(100, 'Máximo 100 caracteres'),
      pesoAproximadoKg: optionalNumber(),
      selloInspeccion: optionalString().max(100, 'Máximo 100 caracteres'),
      libroCilindro: optionalString().max(30, 'Máximo 30 caracteres'),
      paginaLibro: optionalNumber(),
      fechaRegistro: optionalString(),
      numeroRecepcion: optionalString().max(30, 'Máximo 30 caracteres'),
      idAlmacen: optionalNumber().test(
        'almacen-requerido',
        'El almacén es obligatorio',
        function (value) {
          const nombre = nombrePropietario(this.parent.idPropietario)
          if (nombre === 'EMPRESA' || nombre === 'PROPIA') {
            return value != null
          }
          return true
        },
      ),
      idClienteUbicacion: optionalNumber(),
      idPropietario: requiredSelect('El propietario'),
      idClientePropietario: optionalNumber().test(
        'cliente-propietario-requerido',
        'El cliente es obligatorio',
        function (value) {
          if (nombrePropietario(this.parent.idPropietario) === 'CLIENTE') {
            return value != null
          }
          return true
        },
      ),
      idReferencia: optionalNumber(),
      idPlanta: optionalNumber().test(
        'planta-requerida',
        'El proveedor (planta) es obligatorio',
        function (value) {
          if (nombrePropietario(this.parent.idPropietario) === 'PLANTA') {
            return value != null
          }
          return true
        },
      ),
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
    tipoValvula: '',
    pesoAproximadoKg: undefined as number | undefined,
    selloInspeccion: '',
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
    organoInspectorNoAplica: true,
    mesFabricacion: undefined as number | undefined,
    anioFabricacion: undefined as number | undefined,
    presionActual: undefined as number | undefined,
    observacion: '',
  },
})

const [codigoBalon, codigoBalonAttrs] = defineField('codigoBalon')
const [numeroSerie, numeroSerieAttrs] = defineField('numeroSerie')
const [tipoValvula, tipoValvulaAttrs] = defineField('tipoValvula')
const [pesoAproximadoKg, pesoAproximadoKgAttrs] = defineField('pesoAproximadoKg')
const [selloInspeccion, selloInspeccionAttrs] = defineField('selloInspeccion')
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

/** UI: primero decidir si tiene órgano; solo entonces mostrar select + sello. */
const tieneOrganoInspector = computed({
  get: () => !Boolean(organoInspectorNoAplica.value),
  set: (tiene: boolean) => {
    organoInspectorNoAplica.value = !tiene
    if (!tiene) {
      idOrganoInspector.value = undefined
      selloInspeccion.value = ''
    }
  },
})

watch(organoInspectorNoAplica, (noAplica) => {
  if (noAplica) {
    idOrganoInspector.value = undefined
    selloInspeccion.value = ''
  }
})

function onMarcaCreated(opcion: ListaOpcion) {
  idMarcaCilindro.value = opcion.id
}

function onEstadoBalonCreated(opcion: ListaOpcion) {
  idEstadoBalon.value = opcion.id
}

function onContenidoCreated(opcion: ListaOpcion) {
  idEstadoContenido.value = opcion.id
}

function onReferenciaCreated(opcion: ListaOpcion) {
  idReferencia.value = opcion.id
}

function onOrganoCreated(opcion: ListaOpcion) {
  organoInspectorNoAplica.value = false
  idOrganoInspector.value = opcion.id
}

function onCodigoBalonScanned(codigo: string) {
  codigoBalon.value = codigo
}

const propietarioSeleccionadoNombre = computed(() => nombrePropietario(idPropietario.value))

const esPropietarioEmpresa = computed(() => {
  const nombre = propietarioSeleccionadoNombre.value
  return nombre === 'EMPRESA' || nombre === 'PROPIA'
})

const requiereClientePropietario = computed(
  () => propietarioSeleccionadoNombre.value === 'CLIENTE',
)

const requierePlantaPropietario = computed(
  () => propietarioSeleccionadoNombre.value === 'PLANTA',
)

const muestraAlmacen = computed(
  () => esPropietarioEmpresa.value || requierePlantaPropietario.value,
)

const requiereAlmacen = computed(() => esPropietarioEmpresa.value)

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

watch(idPropietario, (nuevo, anterior) => {
  if (nuevo === anterior) return
  if (anterior == null) return

  if (requiereClientePropietario.value) {
    idAlmacen.value = undefined
    idPlanta.value = undefined
    idClienteUbicacion.value = idClientePropietario.value
  } else if (requierePlantaPropietario.value) {
    idClientePropietario.value = undefined
    idClienteUbicacion.value = undefined
  } else {
    idClientePropietario.value = undefined
    idPlanta.value = undefined
    idClienteUbicacion.value = undefined
    if (props.mode === 'create' && !idAlmacen.value) {
      aplicarAlmacenPorDefecto()
    }
  }

  if (props.mode === 'create') {
    aplicarEstadoSegunPropietario()
  }
})

watch(idClientePropietario, (id) => {
  if (requiereClientePropietario.value) {
    idClienteUbicacion.value = id
  }
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
    tipoValvula: string
    pesoAproximadoKg?: number
    selloInspeccion: string
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
    tipoValvula: values.tipoValvula || undefined,
    pesoAproximadoKg:
      values.pesoAproximadoKg != null ? Number(values.pesoAproximadoKg) : undefined,
    selloInspeccion: values.organoInspectorNoAplica
      ? undefined
      : values.selloInspeccion || undefined,
    libroCilindro: values.libroCilindro || undefined,
    paginaLibro: values.paginaLibro,
    fechaRegistro: values.fechaRegistro || undefined,
    numeroRecepcion: values.numeroRecepcion || undefined,
    idAlmacen: esPropietarioEmpresa.value || requierePlantaPropietario.value
      ? values.idAlmacen
      : undefined,
    idClienteUbicacion: requiereClientePropietario.value
      ? values.idClientePropietario
      : undefined,
    idPropietario: values.idPropietario,
    idClientePropietario: requiereClientePropietario.value ? values.idClientePropietario : undefined,
    idReferencia: values.idReferencia,
    idPlanta: requierePlantaPropietario.value ? values.idPlanta : undefined,
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
      tipoValvula: data?.tipo_valvula ?? '',
      pesoAproximadoKg: data?.peso_aproximado_kg ?? undefined,
      selloInspeccion: data?.sello_inspeccion ?? '',
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
      organoInspectorNoAplica:
        data?.organo_inspector_no_aplica ?? !data?.id_organo_inspector,
      mesFabricacion: mesFromDate,
      anioFabricacion: data?.anio_fabricacion ?? undefined,
      presionActual: data?.presion_actual ?? undefined,
      observacion: data?.observacion ?? '',
    },
  })
}

function aplicarAlmacenPorDefecto() {
  if (idAlmacen.value || props.preset?.idAlmacen) return
  const almacenes = almacenesQuery.data.value?.data ?? []
  if (!almacenes.length) return
  const principal = almacenes.find((almacen) =>
    almacen.nombre.toLowerCase().includes('principal'),
  )
  idAlmacen.value = (principal ?? almacenes[0]).id
}

function aplicarEstadoSegunPropietario() {
  if (requiereClientePropietario.value) {
    const enCliente = idOpcionLista(estadoBalonQuery.data.value, 'EN_PODER_CLIENTE')
    if (enCliente) idEstadoBalon.value = enCliente
    const refCliente = idOpcionLista(referenciaQuery.data.value, 'CLIENTE')
    if (refCliente) idReferencia.value = refCliente
    return
  }
  const enAlmacen = idOpcionLista(estadoBalonQuery.data.value, 'EN_ALMACEN')
  if (enAlmacen) idEstadoBalon.value = enAlmacen
  const refAlmacen = idOpcionLista(referenciaQuery.data.value, 'ALMACEN')
  if (refAlmacen) idReferencia.value = refAlmacen
}

function aplicarDefaultsCreacion() {
  if (props.mode !== 'create' || !props.active) return

  if (!idPropietario.value) {
    idPropietario.value =
      props.preset?.idPropietario ?? idOpcionLista(propietarioQuery.data.value, 'EMPRESA')
  }
  if (!idEstadoBalon.value) {
    idEstadoBalon.value =
      props.preset?.idEstadoBalon ?? idOpcionLista(estadoBalonQuery.data.value, 'EN_ALMACEN')
  }
  if (!idEstadoContenido.value) {
    idEstadoContenido.value = idOpcionLista(estadoContenidoQuery.data.value, 'VACIO')
  }
  if (!idMarcaCilindro.value) {
    idMarcaCilindro.value = idOpcionLista(marcaQuery.data.value, 'BTIC-JP')
  }
  if (!idReferencia.value) {
    idReferencia.value = idOpcionLista(referenciaQuery.data.value, 'ALMACEN')
  }
  if (esPropietarioEmpresa.value || !idPropietario.value) {
    aplicarAlmacenPorDefecto()
  }
}

const applyCreateForm = () => {
  resetForm({
    values: {
      codigoBalon: props.preset?.codigoBalon ?? '',
      numeroSerie: props.preset?.codigoBalon ?? '',
      tipoValvula: '',
      pesoAproximadoKg: undefined,
      selloInspeccion: '',
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
      organoInspectorNoAplica: true,
      mesFabricacion: undefined,
      anioFabricacion: undefined,
      presionActual: undefined,
      observacion: '',
    },
  })
  aplicarDefaultsCreacion()
}

const onSubmit = handleSubmit(async (values) => {
  const currentUserId = authStore.user?.id
  if (!currentUserId) return

  if (values.idTipoBalon == null || values.idTipoBalon === '') return
  if (values.idProductoGas == null || values.idProductoGas === '') return
  if (values.idPropietario == null || values.idPropietario === '') return

  const payload = buildPayload(
    {
      ...values,
      idTipoBalon: values.idTipoBalon,
      idProductoGas: values.idProductoGas,
      idPropietario: Number(values.idPropietario),
      numeroSerie: values.numeroSerie ?? '',
      tipoValvula: values.tipoValvula ?? '',
      selloInspeccion: values.selloInspeccion ?? '',
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

watch(
  [
    () => propietarioQuery.data.value,
    () => estadoBalonQuery.data.value,
    () => estadoContenidoQuery.data.value,
    () => marcaQuery.data.value,
    () => referenciaQuery.data.value,
    () => almacenesQuery.data.value,
  ],
  () => {
    aplicarDefaultsCreacion()
  },
)
</script>
