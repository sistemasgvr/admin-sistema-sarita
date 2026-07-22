<template>
  <AppModal
    v-model="open"
    :title="mode === 'create' ? 'Nuevo cliente' : 'Editar cliente'"
    :subtitle="
      mode === 'create'
        ? 'Registra un nuevo cliente en el sistema.'
        : 'Actualiza los datos del cliente seleccionado.'
    "
    size="lg"
    @close="handleClose"
  >
    <form id="cliente-form" class="space-y-4" autocomplete="off" @submit="onSubmit">
      <section
        class="rounded-xl border border-gray-200 bg-white p-4 shadow-theme-xs dark:border-gray-800 dark:bg-gray-900/40"
      >
        <h5 class="mb-3 text-sm font-semibold text-gray-800 dark:text-white/90">Documento</h5>

        <div class="grid gap-3 sm:grid-cols-3">
          <AppSelect
            v-model="idTipoDocumento"
            label="Tipo de documento"
            required
            :placeholder="tipoDocumentoQuery.isLoading.value ? 'Cargando...' : 'Selecciona...'"
            :options="tipoDocumentoOptions"
            :disabled="isSubmitting || tipoDocumentoQuery.isLoading.value"
            v-bind="idTipoDocumentoAttrs"
            :error="
              tipoDocumentoQuery.isError.value
                ? 'No se pudo cargar el catálogo'
                : errors.idTipoDocumento
            "
          />
          <div class="sm:col-span-2">
            <div class="flex items-end gap-2">
              <div class="flex-1">
                <AppInput
                  v-model="numeroDocumento"
                  label="Número de documento"
                  placeholder="12345678"
                  :required="!esDocumentoVSD"
                  v-bind="numeroDocumentoAttrs"
                  :disabled="isSubmitting"
                  :error="errors.numeroDocumento"
                  @focusout="checkDocumento"
                />
              </div>

              <button
                type="button"
                class="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-gray-300 bg-white transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-white-200 dark:hover:bg-white/[0.03]"
                :disabled="isSubmitting || isConsultandoDocumento"
                title="Consultar RENIEC / SUNAT"
                @click="handleConsultarDocumento"
              >
                <AppIcon
                  v-if="isConsultandoDocumento"
                  :name="ICONS.loader"
                  :size="18"
                  class="animate-spin text-gray-500 dark:text-gray-400"
                />
                <svg
                  v-else
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-4.5 w-4.5"
                  viewBox="0 0 275 304"
                  fill="none"
                >
                  <path
                    d="M211.863 200.619C213.211 193.045 214.694 185.513 215.918 177.929C218.863 159.659 209.147 143.162 191.25 139.064C176.494 135.682 161.221 134.613 146.185 132.424C132.519 130.422 118.396 129.872 105.341 125.836C85.3393 119.642 70.4699 107.161 68.1161 84.2842C66.9652 73.1311 69.8374 62.9117 77.3965 54.9022C93.7279 37.6071 110.65 20.8722 127.417 3.98174C132.985 -1.62076 141.727 -1.16426 147.367 4.42786C164.238 21.1731 181.316 37.7212 198.155 54.4976C209.313 65.6092 220.096 77.0944 231.233 88.2164C241.675 98.6536 252.635 108.572 262.796 119.269C267.255 123.937 273.363 127.538 274.368 135.174C275.727 145.372 268.074 149.823 262.33 155.405C250.779 166.631 238.968 177.587 227.23 188.626C222.554 193.025 217.794 197.341 213.077 201.698L211.863 200.619Z"
                    fill="#AD0C41"
                  />
                  <path
                    d="M62.9415 101.278C61.7698 107.379 60.5255 112.12 60.0382 116.945C59.302 123.628 58.9524 130.348 58.9909 137.072C59.2501 153.485 73.1136 162.916 86.2513 166.496C104.262 171.393 122.751 172.16 141.28 172.731C157.352 173.229 172.429 177.503 185.93 186.364C199.181 195.058 206.544 207.985 207.321 223.371C207.809 232.916 203.205 242.192 196.631 249.579C189.009 258.128 180.942 266.282 172.896 274.437C164.186 283.277 155.289 291.971 146.413 300.644C142.898 304.078 132.653 304.525 129.086 301.08C119.443 291.743 110.007 282.166 100.519 272.653C92.7839 264.913 85.09 257.132 77.3753 249.371C65.876 237.803 54.4388 226.183 42.8876 214.677C32.0104 203.835 20.988 193.17 10.0901 182.359C7.32136 179.706 4.73689 176.867 2.3547 173.862C0.713797 171.667 -0.114062 168.969 0.0126584 166.231C0.139379 163.493 1.21281 160.883 3.04943 158.849C7.88144 153.413 13.2112 148.412 18.4787 143.39C32.8918 129.644 47.3982 115.99 62.9311 101.278H62.9415Z"
                    fill="#0063AD"
                  />
                </svg>
              </button>
            </div>
            <p class="mt-1.5 text-theme-xs text-gray-500 dark:text-gray-400">
              Busca automáticamente en RENIEC (DNI) o SUNAT (RUC) según el tipo de documento.
            </p>
          </div>
        </div>

        <div class="mt-3">
          <AppInput
            v-model="codigoInterno"
            label="Código interno"
            placeholder="Opcional"
            v-bind="codigoInternoAttrs"
            :disabled="isSubmitting"
            :error="errors.codigoInterno"
          />
        </div>
      </section>
      <section
        class="rounded-xl border border-gray-200 bg-white p-4 shadow-theme-xs dark:border-gray-800 dark:bg-gray-900/40"
      >
        <h5 class="mb-3 text-sm font-semibold text-gray-800 dark:text-white/90">Datos generales</h5>

        <div class="grid gap-3 sm:grid-cols-2">
          <AppSelect
            v-model="idTipoCliente"
            label="Tipo de cliente"
            :required="!esDocumentoVSD"
            :placeholder="tipoClienteQuery.isLoading.value ? 'Cargando...' : 'Selecciona...'"
            :options="tipoClienteOptions"
            :disabled="isSubmitting || tipoClienteQuery.isLoading.value"
            v-bind="idTipoClienteAttrs"
            :error="
              tipoClienteQuery.isError.value
                ? 'No se pudo cargar el catálogo'
                : errors.idTipoCliente
            "
          />

          <AppSelect
            v-model="idTipoPersona"
            label="Tipo de Contribuyente"
            :required="!esDocumentoVSD"
            :placeholder="tipoPersonaQuery.isLoading.value ? 'Cargando...' : 'Selecciona...'"
            :options="tipoPersonaOptions"
            :disabled="isSubmitting || tipoPersonaQuery.isLoading.value"
            v-bind="idTipoPersonaAttrs"
            :error="
              tipoPersonaQuery.isError.value
                ? 'No se pudo cargar el catálogo'
                : errors.idTipoPersona
            "
          />
        </div>
        <div class="mt-3">
          <AppInput
            v-model="razonSocial"
            label="Razón social"
            placeholder="Comercial Los Andes S.A.C."
            :required="esDocumentoRUC || esDocumentoVSD"
            v-bind="razonSocialAttrs"
            :disabled="isSubmitting || (!esDocumentoRUC && !esDocumentoVSD)"
            :error="errors.razonSocial"
            hint="Obligatorio para RUC."
          />
        </div>

        <div class="mt-3 grid grid-cols-4 gap-3">
          <div class="col-span-4 sm:col-span-2">
            <AppInput
              v-model="nombres"
              label="Nombres"
              placeholder="Juan"
              :required="requiereNombres"
              v-bind="nombresAttrs"
              :disabled="isSubmitting"
              :error="errors.nombres"
            />
          </div>

          <div class="col-span-2 sm:col-span-1">
            <AppInput
              v-model="apellidoPaterno"
              label="Ap. paterno"
              v-bind="apellidoPaternoAttrs"
              :disabled="isSubmitting"
              :error="errors.apellidoPaterno"
            />
          </div>

          <div class="col-span-2 sm:col-span-1">
            <AppInput
              v-model="apellidoMaterno"
              label="Ap. materno"
              v-bind="apellidoMaternoAttrs"
              :disabled="isSubmitting"
              :error="errors.apellidoMaterno"
            />
          </div>
        </div>
      </section>
      <section
        class="rounded-xl border border-gray-200 bg-white p-4 shadow-theme-xs dark:border-gray-800 dark:bg-gray-900/40"
      >
        <h5 class="mb-3 text-sm font-semibold text-gray-800 dark:text-white/90">
          Contacto y ubicación
        </h5>

        <div class="grid gap-3 sm:grid-cols-2">
          <AppInput
            v-model="telefono"
            label="Teléfono"
            placeholder="999 999 999"
            v-bind="telefonoAttrs"
            :disabled="isSubmitting"
            :error="errors.telefono"
          />

          <AppInput
            v-model="email"
            type="email"
            label="Correo"
            placeholder="correo@ejemplo.com"
            v-bind="emailAttrs"
            :disabled="isSubmitting"
            :error="errors.email"
          />
        </div>

        <div class="mt-3 grid gap-3 sm:grid-cols-2">
          <AppInput
            v-model="direccion"
            label="Dirección"
            placeholder="Av. Principal 123"
            v-bind="direccionAttrs"
            :disabled="isSubmitting"
            :error="errors.direccion"
          />
          <AppInput
            v-model="referencia"
            label="Referencia"
            placeholder="Frente al parque"
            v-bind="referenciaAttrs"
            :disabled="isSubmitting"
            :error="errors.referencia"
          />
          <div class="sm:col-span-2">
            <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Ubicación en el mapa
            </label>
            <MapaLeaflet
              v-model:latitud="latitud"
              v-model:longitud="longitud"
              height="300px"
              :searchable="true"
              :draggable-marker="true"
              :readonly="false"
              :resolve-google-maps-link="resolverCoordenadasDesdeLink"
            />
          </div>
        </div>
        <div class="mt-3 grid grid-cols-2 gap-3">
          <AppSelect
            v-model="idPaisUI"
            label="País"
            :placeholder="paisesQuery.isLoading.value ? 'Cargando...' : 'Selecciona...'"
            :options="paisesOptions"
            :disabled="isSubmitting || paisesQuery.isLoading.value"
          />
          <AppSelect
            v-model="idDepartamentoUI"
            label="Departamento"
            :placeholder="
              !idPaisUI
                ? 'Selecciona un país'
                : departamentosQuery.isLoading.value
                  ? 'Cargando...'
                  : 'Selecciona...'
            "
            :options="departamentosOptions"
            :disabled="isSubmitting || !idPaisUI || departamentosQuery.isLoading.value"
          />
          <AppSelect
            v-model="idProvinciaUI"
            label="Provincia"
            :placeholder="
              !idDepartamentoUI
                ? 'Selecciona un departamento'
                : provinciasQuery.isLoading.value
                  ? 'Cargando...'
                  : 'Selecciona...'
            "
            :options="provinciasOptions"
            :disabled="isSubmitting || !idDepartamentoUI || provinciasQuery.isLoading.value"
          />
          <AppSelect
            v-model="idDistrito"
            label="Distrito"
            :placeholder="
              !idProvinciaUI
                ? 'Selecciona una provincia'
                : distritosQuery.isLoading.value
                  ? 'Cargando...'
                  : 'Selecciona...'
            "
            :options="distritosOptions"
            :disabled="isSubmitting || !idProvinciaUI || distritosQuery.isLoading.value"
          />
        </div>
      </section>
      <section
        class="rounded-xl border border-gray-200 bg-white p-4 shadow-theme-xs dark:border-gray-800 dark:bg-gray-900/40"
      >
        <h5 class="mb-3 text-sm font-semibold text-gray-800 dark:text-white/90">
          Configuración SUNAT
        </h5>
        <div class="grid grid-cols-1 gap-x-6 gap-y-2.5 sm:grid-cols-2">
          <div class="flex min-h-[20px] items-center">
            <AppCheckbox
              v-model="esAgentePercepcion"
              label="Agente de percepción"
              :disabled="isSubmitting"
            />
          </div>
          <div class="flex min-h-[20px] items-center">
            <AppCheckbox
              v-model="esBuenContribuyente"
              label="Buen contribuyente"
              :disabled="isSubmitting"
            />
          </div>
          <div class="flex min-h-[20px] items-center">
            <AppCheckbox
              v-model="esAgenteRetenedor"
              label="Agente retenedor"
              :disabled="isSubmitting"
            />
          </div>
          <div class="flex min-h-[20px] items-center">
            <AppCheckbox v-model="afectoRus" label="Afecto a RUS" :disabled="isSubmitting" />
          </div>
          <div class="flex min-h-[20px] items-center">
            <AppCheckbox
              v-model="sunatActivo"
              label="Situación SUNAT: Activo"
              :disabled="isSubmitting"
            />
          </div>
          <div class="flex min-h-[20px] items-center">
            <AppCheckbox
              v-model="sunatHabido"
              label="Condición SUNAT: Habido"
              :disabled="isSubmitting"
            />
          </div>
        </div>
      </section>
      <section
        class="rounded-xl border border-gray-200 bg-white p-4 shadow-theme-xs dark:border-gray-800 dark:bg-gray-900/40"
      >
        <h5 class="mb-3 text-sm font-semibold text-gray-800 dark:text-white/90">Observaciones</h5>
        <AppTextarea
          v-model="observacion"
          placeholder="Notas adicionales sobre el cliente"
          v-bind="observacionAttrs"
          :disabled="isSubmitting"
          :error="errors.observacion"
        />
      </section>

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
        form="cliente-form"
        class="flex w-full justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
        :disabled="isSubmitting"
      >
        {{
          isSubmitting ? 'Guardando...' : mode === 'create' ? 'Crear cliente' : 'Guardar cambios'
        }}
      </button>
    </template>
  </AppModal>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { useForm } from 'vee-validate'
import { useListaOpcionesQuery } from '@/modules/catalogos/composables/useListaOpcionesQuery'
import {
  useDepartamentosQuery,
  usePaisesQuery,
  useProvinciasQuery,
  useDistritosQuery,
} from '@/modules/catalogos/composables/useUbigeoQueries'
import { buscarIdsUbigeoPorNombre } from '@/modules/catalogos/services/ubigeo.service'
import { toSelectOptions } from '@/modules/catalogos/utils/toSelectOptions'
import { consultasService } from '@/modules/consultas/services/consultas.service'
import type {
  ConsultaDniData,
  ConsultaRucData,
} from '@/modules/consultas/interfaces/consulta.interface'
import {
  useCreateClienteMutation,
  useUpdateClienteMutation,
} from '@/modules/clientes/composables/useClienteMutations'
import { documentoYaRegistrado } from '@/modules/clientes/composables/useValidarDocumentoCliente'
import { useClienteDetailQuery } from '@/modules/clientes/composables/useClienteDetailQuery'
import { toClienteFormSchema } from '@/modules/clientes/validation/clienteFormSchema'
import type {
  Cliente,
  ClienteFormMode,
  ClientePayload,
} from '@/modules/clientes/interfaces/cliente.interface'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { direccionesService } from '@/modules/direcciones/services/direcciones.service'
import { AppCheckbox, AppInput, AppModal, AppSelect, AppTextarea, MapaLeaflet } from '@/shared/components'
import AppIcon from '@/shared/components/AppIcon.vue'
import { ICONS } from '@/shared/constants/icons'
import { ListaIds } from '@/shared/constants/lista-ids'
import { toastApiError, toastInfo, toastSuccess, toastWarning } from '@/shared/composables/useToast'

interface ClienteFormModalProps {
  mode: ClienteFormMode
  cliente?: Cliente | null
}

const props = defineProps<ClienteFormModalProps>()

const open = defineModel<boolean>({ default: false })

const emit = defineEmits<{
  saved: [cliente: Cliente]
}>()

const authStore = useAuthStore()
const createMutation = useCreateClienteMutation()
const updateMutation = useUpdateClienteMutation()

// Al abrir en modo edición, se vuelve a pedir el cliente al backend
// en vez de confiar solo en la fila que ya estaba en la tabla.
const idParaEditar = computed(() => (props.mode === 'edit' ? props.cliente?.id : undefined))
const detailQuery = useClienteDetailQuery(idParaEditar, open)
const clienteData = computed(() => detailQuery.data.value ?? props.cliente ?? null)

const isCheckingDocumento = ref(false)
const documentoDuplicado = ref(false)
const isConsultandoDocumento = ref(false)

const resolverCoordenadasDesdeLink = async (link: string) => {
  try {
    const { latitud, longitud } = await direccionesService.coordenadasDesdeLink(link)
    return { lat: latitud, lng: longitud }
  } catch {
    return null
  }
}

// Catálogos dinámicos (Tipo Persona / Tipo Cliente / Tipo Documento)
const listaTipoPersonaId = ref(ListaIds.TIPO_PERSONA)
const listaTipoClienteId = ref(ListaIds.TIPO_CLIENTE)
const listaTipoDocumentoId = ref(ListaIds.TIPO_DOCUMENTO)

const tipoPersonaQuery = useListaOpcionesQuery(listaTipoPersonaId)
const tipoClienteQuery = useListaOpcionesQuery(listaTipoClienteId)
const tipoDocumentoQuery = useListaOpcionesQuery(listaTipoDocumentoId)

const tipoPersonaOptions = computed(() => toSelectOptions(tipoPersonaQuery.data.value))
const tipoClienteOptions = computed(() => toSelectOptions(tipoClienteQuery.data.value))
const tipoDocumentoOptions = computed(() => {
  return (tipoDocumentoQuery.data.value ?? []).map((item) => ({
    label: item.nombre,
    value: item.id,
  }))
})

const validationSchema = computed(() =>
  toClienteFormSchema({
    getTipoDocumentoNombre: (id) =>
      tipoDocumentoQuery.data.value?.find((opcion) => opcion.id === Number(id))?.nombre,
    getTipoPersonaNombre: (id) =>
      tipoPersonaQuery.data.value?.find((opcion) => opcion.id === Number(id))?.nombre,
  }),
)

const { defineField, handleSubmit, resetForm, errors, isSubmitting, setFieldError } = useForm({
  validationSchema,
  initialValues: {
    idTipoDocumento: '',
    numeroDocumento: '',
    codigoInterno: '',
    idTipoCliente: '',
    idTipoPersona: '',
    razonSocial: '',
    nombreComercial: '',
    nombres: '',
    apellidoPaterno: '',
    apellidoMaterno: '',
    telefono: '',
    email: '',
    direccion: '',
    referencia: '',
    latitud: undefined,
    longitud: undefined,
    idDistrito: undefined,
    observacion: '',
  },
})

const [idTipoDocumento, idTipoDocumentoAttrs] = defineField('idTipoDocumento')
const [numeroDocumento, numeroDocumentoAttrs] = defineField('numeroDocumento')
const [codigoInterno, codigoInternoAttrs] = defineField('codigoInterno')
const [idTipoCliente, idTipoClienteAttrs] = defineField('idTipoCliente')
const [idTipoPersona, idTipoPersonaAttrs] = defineField('idTipoPersona')
const [razonSocial, razonSocialAttrs] = defineField('razonSocial')
const [nombres, nombresAttrs] = defineField('nombres')
const [apellidoPaterno, apellidoPaternoAttrs] = defineField('apellidoPaterno')
const [apellidoMaterno, apellidoMaternoAttrs] = defineField('apellidoMaterno')
const [telefono, telefonoAttrs] = defineField('telefono')
const [email, emailAttrs] = defineField('email')
const [direccion, direccionAttrs] = defineField('direccion')
const [referencia, referenciaAttrs] = defineField('referencia')
const [latitud] = defineField('latitud')
const [longitud] = defineField('longitud')
const [idDistrito] = defineField('idDistrito')
const [observacion, observacionAttrs] = defineField('observacion')

const esAgentePercepcion = ref(false)
const esBuenContribuyente = ref(false)
const esAgenteRetenedor = ref(false)
const afectoRus = ref(false)
const sunatActivo = ref(false)
const sunatHabido = ref(false)
const idPaisUI = ref<number | ''>('')
const idDepartamentoUI = ref<number | ''>('')
const idProvinciaUI = ref<number | ''>('')

const paisesQuery = usePaisesQuery()
const departamentosQuery = useDepartamentosQuery(idPaisUI)
const provinciasQuery = useProvinciasQuery(idDepartamentoUI)
const distritosQuery = useDistritosQuery(idProvinciaUI)

const paisesOptions = computed(() => toSelectOptions(paisesQuery.data.value))
const departamentosOptions = computed(() => toSelectOptions(departamentosQuery.data.value))
const provinciasOptions = computed(() => toSelectOptions(provinciasQuery.data.value))
const distritosOptions = computed(() => toSelectOptions(distritosQuery.data.value))
let isSyncingUbigeo = false

watch(idPaisUI, () => {
  if (isSyncingUbigeo) return
  idDepartamentoUI.value = ''
  idProvinciaUI.value = ''
  idDistrito.value = undefined
})

watch(idDepartamentoUI, () => {
  if (isSyncingUbigeo) return
  idProvinciaUI.value = ''
  idDistrito.value = undefined
})

watch(idProvinciaUI, () => {
  if (isSyncingUbigeo) return
  idDistrito.value = undefined
})

const tipoDocumentoSeleccionado = computed(() => {
  const opciones = tipoDocumentoQuery.data.value ?? []
  return opciones.find((opcion) => opcion.id === Number(idTipoDocumento.value))
})

const tipoPersonaSeleccionado = computed(() => {
  const opciones = tipoPersonaQuery.data.value ?? []
  return opciones.find((opcion) => opcion.id === Number(idTipoPersona.value))
})

const esDocumentoVSD = computed(() => {
  return tipoDocumentoSeleccionado.value?.nombre?.toUpperCase() === 'VSD'
})

const esDocumentoRUC = computed(() => {
  return tipoDocumentoSeleccionado.value?.nombre?.toUpperCase() === 'RUC'
})

const requiereNombres = computed(() => {
  const nombre = tipoPersonaSeleccionado.value?.nombre?.toUpperCase() ?? ''
  return nombre.includes('NATURAL')
})

const aplicarDatosDni = (data: ConsultaDniData) => {
  if (data.dni) numeroDocumento.value = data.dni
  if (data.nombres) nombres.value = data.nombres
  if (data.apellidoPaterno) apellidoPaterno.value = data.apellidoPaterno
  if (data.apellidoMaterno) apellidoMaterno.value = data.apellidoMaterno
}

const aplicarDatosRuc = async (data: ConsultaRucData) => {
  if (data.ruc) numeroDocumento.value = data.ruc
  if (data.razonSocial) razonSocial.value = data.razonSocial
  if (data.direccion) direccion.value = data.direccion

  if (data.estado) sunatActivo.value = data.estado === 'ACTIVO'
  if (data.condicion) sunatHabido.value = data.condicion === 'HABIDO'

  if (!data.departamento) return

  isSyncingUbigeo = true
  try {
    const idPaisPeru = paisesQuery.data.value?.[0]?.id ?? 1
    idPaisUI.value = idPaisPeru

    const coincidencias = await buscarIdsUbigeoPorNombre({
      idPais: idPaisPeru,
      departamento: data.departamento,
      provincia: data.provincia,
      distrito: data.distrito,
    })

    if (coincidencias.idDepartamento) idDepartamentoUI.value = coincidencias.idDepartamento
    if (coincidencias.idProvincia) idProvinciaUI.value = coincidencias.idProvincia
    if (coincidencias.idDistrito) idDistrito.value = coincidencias.idDistrito
  } finally {
    await nextTick()
    isSyncingUbigeo = false
  }
}

const handleConsultarDocumento = async () => {
  const numero = String(numeroDocumento.value ?? '').trim()

  if (!numero) {
    toastWarning('Ingresa un número de documento para consultar')
    return
  }

  const tipo = tipoDocumentoSeleccionado.value?.nombre?.toUpperCase()

  if (!tipo) {
    toastWarning('Selecciona primero el tipo de documento')
    return
  }

  limpiarCamposConsulta()

  isConsultandoDocumento.value = true
  try {
    if (tipo === 'DNI') {
      const data = await consultasService.consultarDni(numero)
      aplicarDatosDni(data)
      toastSuccess('Datos de RENIEC cargados')
    } else if (tipo === 'RUC') {
      const data = await consultasService.consultarRuc(numero)
      await aplicarDatosRuc(data)
      toastSuccess('Datos de SUNAT cargados')
    } else {
      toastInfo('La consulta automática solo está disponible para DNI o RUC')
    }
  } catch (error) {
    toastApiError(
      error,
      'No se pudo completar la consulta. Verifica el número e inténtalo de nuevo.',
    )
  } finally {
    isConsultandoDocumento.value = false
  }
}

const checkDocumento = async () => {
  if (!numeroDocumento.value) return

  isCheckingDocumento.value = true
  try {
    documentoDuplicado.value = await documentoYaRegistrado(
      String(numeroDocumento.value),
      props.mode === 'edit' ? props.cliente?.id : undefined,
    )

    if (documentoDuplicado.value) {
      setFieldError('numeroDocumento', 'Este número de documento ya está registrado')
    }
  } finally {
    isCheckingDocumento.value = false
  }
}

const syncFormValues = async () => {
  const cliente = clienteData.value
  resetForm({
    values: {
      idTipoDocumento: cliente?.id_tipo_documento ?? '',
      numeroDocumento: cliente?.numero_documento ?? '',
      codigoInterno: cliente?.codigo_interno ?? '',
      idTipoCliente: cliente?.id_tipo_cliente ?? '',
      idTipoPersona: cliente?.id_tipo_persona ?? '',
      razonSocial: cliente?.razon_social ?? '',
      nombreComercial: cliente?.nombre_comercial ?? '',
      nombres: cliente?.nombres ?? '',
      apellidoPaterno: cliente?.apellido_paterno ?? '',
      apellidoMaterno: cliente?.apellido_materno ?? '',
      telefono: cliente?.telefono ?? '',
      email: cliente?.email ?? '',
      direccion: cliente?.direccion ?? '',
      referencia: cliente?.referencia ?? '',
      latitud: cliente?.latitud ?? undefined,
      longitud: cliente?.longitud ?? undefined,
      idDistrito: cliente?.id_distrito ?? undefined,
      observacion: cliente?.observacion ?? '',
    },
  })

  esAgentePercepcion.value = cliente?.es_agente_percepcion ?? false
  esBuenContribuyente.value = cliente?.es_buen_contribuyente ?? false
  esAgenteRetenedor.value = cliente?.es_agente_retenedor ?? false
  afectoRus.value = cliente?.afecto_rus ?? false
  sunatActivo.value = cliente?.situacion_sunat === 'ACTIVO'
  sunatHabido.value = cliente?.estado_contribuyente_sunat === 'HABIDO'
  documentoDuplicado.value = false

  isSyncingUbigeo = true
  idPaisUI.value = cliente?.id_pais ?? ''
  idDepartamentoUI.value = cliente?.id_departamento ?? ''
  idProvinciaUI.value = cliente?.id_provincia ?? ''
  await nextTick()
  isSyncingUbigeo = false
}

const limpiarCamposConsulta = () => {
  razonSocial.value = ''
  nombres.value = ''
  apellidoPaterno.value = ''
  apellidoMaterno.value = ''
  direccion.value = ''

  sunatActivo.value = false
  sunatHabido.value = false

  idPaisUI.value = ''
  idDepartamentoUI.value = ''
  idProvinciaUI.value = ''
  idDistrito.value = undefined
  latitud.value = undefined
  longitud.value = undefined
}

const handleClose = () => {
  open.value = false
}

const onSubmit = handleSubmit(async (values) => {
  const currentUserId = authStore.user?.id
  if (!currentUserId) return

  if (documentoDuplicado.value) {
    setFieldError('numeroDocumento', 'Este número de documento ya está registrado')
    return
  }

  const payload: ClientePayload = {
    idUsuarioAuditoria: currentUserId,
    idTipoDocumento: Number(values.idTipoDocumento),
    numeroDocumento: values.numeroDocumento?.trim() ? values.numeroDocumento.trim() : null,
    codigoInterno: values.codigoInterno || undefined,
    idTipoCliente: Number(values.idTipoCliente),
    idTipoPersona: Number(values.idTipoPersona),
    razonSocial: values.razonSocial || undefined,
    nombres: values.nombres || undefined,
    apellidoPaterno: values.apellidoPaterno || undefined,
    apellidoMaterno: values.apellidoMaterno || undefined,
    telefono: values.telefono || undefined,
    email: values.email || undefined,
    direccion: values.direccion || undefined,
    referencia: values.referencia || undefined,
    latitud: values.latitud || undefined,
    longitud: values.longitud || undefined,
    idPais: idPaisUI.value ? Number(idPaisUI.value) : undefined,
    idDepartamento: idDepartamentoUI.value ? Number(idDepartamentoUI.value) : undefined,
    idProvincia: idProvinciaUI.value ? Number(idProvinciaUI.value) : undefined,
    idDistrito: values.idDistrito ? Number(values.idDistrito) : undefined,
    esAgentePercepcion: esAgentePercepcion.value,
    esBuenContribuyente: esBuenContribuyente.value,
    esAgenteRetenedor: esAgenteRetenedor.value,
    afectoRus: afectoRus.value,
    situacionSunat: sunatActivo.value ? 'ACTIVO' : 'BAJA',
    estadoContribuyenteSunat: sunatHabido.value ? 'HABIDO' : 'NO HABIDO',
    observacion: values.observacion || undefined,
  }

  try {
    let clienteGuardado: Cliente

    if (props.mode === 'create') {
      clienteGuardado = await createMutation.mutateAsync(payload)
    } else if (props.cliente) {
      clienteGuardado = await updateMutation.mutateAsync({
        id: props.cliente.id,
        payload,
      })
    } else {
      return
    }

    emit('saved', clienteGuardado)
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
  () => props.cliente,
  () => {
    if (open.value) {
      syncFormValues()
    }
  },
)
watch(
  () => detailQuery.data.value,
  (data) => {
    if (open.value && data) {
      syncFormValues()
    }
  },
)
</script>
