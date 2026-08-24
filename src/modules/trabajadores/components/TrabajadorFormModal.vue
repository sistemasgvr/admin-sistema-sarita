<template>
  <AppModal
    v-model="open"
    :title="mode === 'create' ? 'Nuevo trabajador' : 'Editar trabajador'"
    subtitle="Registra los datos del trabajador en el padrón de personal (RR.HH.)."
    size="lg"
    @close="handleClose"
  >
    <form id="trabajador-form" class="space-y-5" autocomplete="off" @submit="onSubmit">
      <!-- Datos personales -->
      <section class="space-y-3">
        <h4 class="text-sm font-semibold text-gray-700 dark:text-gray-200">Datos personales</h4>
        <div class="grid gap-3 sm:grid-cols-3">
            <AppSelect
            v-model="idTipoDocumento"
            label="Tipo de documento"
            :placeholder="tipoDocumentoQuery.isLoading.value ? 'Cargando...' : 'Selecciona...'"
            required
            v-bind="idTipoDocumentoAttrs"
            :disabled="isSubmitting || tipoDocumentoQuery.isLoading.value"
            :error="errors.idTipoDocumento"
            :options="tipoDocumentoOptions"
          />
          <ConsultaDocumentoInput
            v-model="numeroDocumento"
            :tipo-documento="tipoDocumentoSeleccionado?.nombre"
            label="Número de documento"
            required
            :input-attrs="numeroDocumentoAttrs"
            :disabled="isSubmitting"
            :error="errors.numeroDocumento"
            @dni-encontrado="aplicarDatosDni"
            @ruc-encontrado="aplicarDatosRuc"
          />
          <AppInput
            v-model="nombres"
            label="Nombres"
            placeholder="Juan"
            required
            v-bind="nombresAttrs"
            :disabled="isSubmitting"
            :error="errors.nombres"
          />
        </div>

        <div class="grid gap-3 sm:grid-cols-3">
          <AppInput
            v-model="apellidoPaterno"
            label="Apellido paterno"
            placeholder="Pérez"
            v-bind="apellidoPaternoAttrs"
            :disabled="isSubmitting"
            :error="errors.apellidoPaterno"
          />
          <AppInput
            v-model="apellidoMaterno"
            label="Apellido materno"
            placeholder="Lopez"
            v-bind="apellidoMaternoAttrs"
            :disabled="isSubmitting"
            :error="errors.apellidoMaterno"
          />
          <AppDatePicker
            v-model="fechaNacimiento"
            label="Fecha de nacimiento"
            :disabled="isSubmitting"
            :error="errors.fechaNacimiento"
          />
        </div>

        <p v-if="edadCalculada !== null" class="text-xs text-gray-500 dark:text-gray-400">
          Edad actual: <span class="font-medium text-gray-700 dark:text-gray-200">{{ edadCalculada }} años</span>
        </p>

        <div class="grid gap-3 sm:grid-cols-2">
          <AppInput
            v-model="correo"
            type="email"
            label="Correo electrónico"
            placeholder="nombre@empresa.com"
            v-bind="correoAttrs"
            :disabled="isSubmitting"
            :error="errors.correo"
          />
        </div>
      </section>

      <!-- Dirección -->
      <section class="space-y-3">
        <h4 class="text-sm font-semibold text-gray-700 dark:text-gray-200">Dirección</h4>
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
        <div class="grid gap-3 sm:grid-cols-4">
          <AppSelect
            v-model="idPais"
            label="País"
            placeholder="País"
            v-bind="idPaisAttrs"
            :disabled="isSubmitting || paisesQuery.isLoading.value"
            :error="errors.idPais"
            :options="paisOptions"
          />
          <AppSelect
            v-model="idDepartamento"
            label="Departamento"
            placeholder="Departamento"
            v-bind="idDepartamentoAttrs"
            :disabled="isSubmitting || !idPais || departamentosQuery.isLoading.value"
            :error="errors.idDepartamento"
            :options="departamentoOptions"
          />
          <AppSelect
            v-model="idProvincia"
            label="Provincia"
            placeholder="Provincia"
            v-bind="idProvinciaAttrs"
            :disabled="isSubmitting || !idDepartamento || provinciasQuery.isLoading.value"
            :error="errors.idProvincia"
            :options="provinciaOptions"
          />
          <AppSelect
            v-model="idDistrito"
            label="Distrito"
            placeholder="Distrito"
            v-bind="idDistritoAttrs"
            :disabled="isSubmitting || !idProvincia || distritosQuery.isLoading.value"
            :error="errors.idDistrito"
            :options="distritoOptions"
          />
        </div>
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
      </section>

      <!-- Datos laborales -->
      <section class="space-y-3">
        <h4 class="text-sm font-semibold text-gray-700 dark:text-gray-200">Datos laborales</h4>
        <div class="grid gap-3 sm:grid-cols-2">
          <AppSelectWithCreate
            :can-create="true"
            create-title="Agregar área"
            @create="areaModalOpen = true"
          >
            <AppSelect
              v-model="idArea"
              label="Área"
              :placeholder="areaQuery.isLoading.value ? 'Cargando...' : 'Selecciona...'"
              v-bind="idAreaAttrs"
              :disabled="isSubmitting || areaQuery.isLoading.value"
              :error="errors.idArea"
              :options="areaOptions"
            />
          </AppSelectWithCreate>
          <AppSelectWithCreate
            :can-create="true"
            create-title="Agregar cargo"
            @create="cargoModalOpen = true"
          >
            <AppSelect
              v-model="idCargo"
              label="Cargo"
              :placeholder="cargoQuery.isLoading.value ? 'Cargando...' : 'Selecciona...'"
              v-bind="idCargoAttrs"
              :disabled="isSubmitting || cargoQuery.isLoading.value"
              :error="errors.idCargo"
              :options="cargoOptions"
            />
          </AppSelectWithCreate>
        </div>
        <div class="grid gap-3 sm:grid-cols-2">
          <AppDatePicker
            v-model="fechaInicio"
            label="Fecha de inicio"
            :disabled="isSubmitting"
            :error="errors.fechaInicio"
          />
          <AppDatePicker
            v-model="fechaCese"
            label="Fecha de cese"
            :disabled="isSubmitting"
            :error="errors.fechaCese"
          />
        </div>
      </section>

      <!-- Acceso al sistema -->
      <section class="space-y-3">
        <h4 class="text-sm font-semibold text-gray-700 dark:text-gray-200">Acceso al sistema</h4>
        <AppCheckbox
          v-model="crearUsuario"
          label="Crear usuario para este trabajador"
          :disabled="isSubmitting"
        />
        <p class="text-xs text-gray-500 dark:text-gray-400">
          Se generará un usuario con el correo y el número de documento como contraseña inicial.
        </p>
        <!-- La asignación de chofer se mantiene opcional en el backend, pero se comenta en el formulario:
        <SearchableSelect
          v-model="idChofer"
          label="Chofer"
          placeholder="Buscar chofer..."
          empty-option-label="Sin chofer asignado"
          :model-label="choferLabelActual"
          :search-fn="searchChoferes"
          :disabled="isSubmitting"
        /> -->
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
        form="trabajador-form"
        class="flex w-full justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
        :disabled="isSubmitting"
      >
        {{ isSubmitting ? 'Guardando...' : mode === 'create' ? 'Crear trabajador' : 'Guardar cambios' }}
      </button>
    </template>

    <ListaOpcionFormModal
      :id-lista="ListaIds.AREAS_TRABAJADOR"
      v-model="areaModalOpen"
      title="Nueva área"
      nombre-placeholder="Ej. Operaciones, Administración"
      @saved="onAreaCreada"
    />

    <ListaOpcionFormModal
      :id-lista="ListaIds.CARGOS_TRABAJADOR"
      v-model="cargoModalOpen"
      title="Nuevo cargo"
      nombre-placeholder="Ej. Supervisor, Técnico"
      @saved="onCargoCreada"
    />
  </AppModal>

  <AppModal
    v-model="credencialesModalOpen"
    title="Usuario de acceso creado"
    subtitle="Comparta estas credenciales con el trabajador de forma segura."
    size="md"
    :dismissible="true"
  >
    <div class="space-y-4">
      <dl class="space-y-2 text-sm">
        <div class="flex gap-2">
          <dt class="w-28 shrink-0 font-medium text-gray-600 dark:text-gray-300">Correo:</dt>
          <dd class="font-mono text-gray-900 dark:text-gray-100">{{ credencialesInfo?.correo }}</dd>
        </div>
        <div class="flex gap-2">
          <dt class="w-28 shrink-0 font-medium text-gray-600 dark:text-gray-300">Contraseña:</dt>
          <dd class="font-mono text-gray-900 dark:text-gray-100">{{ credencialesInfo?.numeroDocumento }}</dd>
        </div>
      </dl>

      <div class="flex items-start gap-2 rounded-md bg-amber-50 p-3 text-xs text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
        <span class="mt-0.5">⚠</span>
        <p>No olvide asignar permisos a este usuario desde el módulo de <strong>Usuarios / Roles</strong>.</p>
      </div>

      <div class="flex justify-end">
        <RouterLink
          to="/admin/usuarios"
          class="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
        >
          Ir a Usuarios
        </RouterLink>
      </div>
    </div>
  </AppModal>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/yup'
import * as yup from 'yup'
import { useListaOpcionesQuery } from '@/modules/catalogos/composables/useListaOpcionesQuery'
import { toSelectOptions } from '@/modules/catalogos/utils/toSelectOptions'
import {
  useDepartamentosQuery,
  useDistritosQuery,
  usePaisesQuery,
  useProvinciasQuery,
} from '@/modules/catalogos/composables/useUbigeoQueries'
import {
  useCreateTrabajadorMutation,
  useUpdateTrabajadorMutation,
} from '@/modules/trabajadores/composables/useTrabajadorMutations'
import { useTrabajadorDetailQuery } from '@/modules/trabajadores/composables/useTrabajadoresQuery'
import type { Trabajador, TrabajadorFormMode } from '@/modules/trabajadores/interfaces/trabajador.interface'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { AppDatePicker, AppInput, AppModal, AppSelect, AppSelectWithCreate } from '@/shared/components'
import AppCheckbox from '@/shared/components/form/AppCheckbox.vue'
import MapaLeaflet from '@/shared/components/map/MapaLeaflet.vue'
import ListaOpcionFormModal from '@/modules/catalogos/components/ListaOpcionFormModal.vue'
import ConsultaDocumentoInput from '@/modules/consultas/components/ConsultaDocumentoInput.vue'
import { ListaIds } from '@/shared/constants/lista-ids'
import { RouterLink } from 'vue-router'
import type { ListaOpcion } from '@/modules/catalogos/interfaces/lista-opcion.interface'
import type { ConsultaDniData, ConsultaRucData } from '@/modules/consultas/interfaces/consulta.interface'
import type { SelectOption } from '@/shared/interfaces/form.interface'
import { optionalString, requiredString } from '@/shared/validation'
import { direccionesService } from '@/modules/direcciones/services/direcciones.service'

interface TrabajadorFormModalProps {
  mode: TrabajadorFormMode
  trabajador?: Trabajador | null
}

const props = withDefaults(defineProps<TrabajadorFormModalProps>(), {})

const open = defineModel<boolean>({ default: false })

const emit = defineEmits<{
  saved: [trabajador?: Trabajador]
}>()

const authStore = useAuthStore()

const createMutation = useCreateTrabajadorMutation()
const updateMutation = useUpdateTrabajadorMutation()
const idReferencia = computed(() => props.trabajador?.id)
const trabajadorDetailQuery = useTrabajadorDetailQuery(idReferencia, open)
const trabajadorActual = computed<Trabajador | null>(
  () => trabajadorDetailQuery.data.value ?? props.trabajador ?? null,
)

const { defineField, handleSubmit, resetForm, errors, isSubmitting } = useForm({
  validationSchema: toTypedSchema(
    yup.object({
      nombres: requiredString('Los nombres'),
      apellidoPaterno: optionalString(),
      apellidoMaterno: optionalString(),
      idTipoDocumento: yup.number().required('El tipo de documento es obligatorio'),
      numeroDocumento: requiredString('El número de documento'),
      fechaNacimiento: optionalString(),
      direccion: optionalString(),
      referencia: optionalString(),
      idPais: yup.number().optional().nullable(),
      idDepartamento: yup.number().optional().nullable(),
      idProvincia: yup.number().optional().nullable(),
      idDistrito: yup.number().optional().nullable(),
      latitud: yup.number().optional().nullable(),
      longitud: yup.number().optional().nullable(),
      idArea: yup.number().optional().nullable(),
      idCargo: yup.number().optional().nullable(),
      fechaInicio: optionalString(),
      fechaCese: optionalString(),
      idUsuarioVinculo: yup.number().optional().nullable(),
      idChofer: yup.number().optional().nullable(),
      correo: yup
        .string()
        .email('Ingresa un correo válido')
        .nullable()
        .when('crearUsuario', {
          is: true,
          then: (s) => s.required('El correo es obligatorio para crear el usuario'),
        }),
      crearUsuario: yup.boolean().optional(),
    }),
  ),
  initialValues: {
    nombres: '',
    apellidoPaterno: '',
    apellidoMaterno: '',
    idTipoDocumento: undefined as number | undefined,
    numeroDocumento: '',
    fechaNacimiento: '',
    direccion: '',
    referencia: '',
    idPais: undefined as number | undefined,
    idDepartamento: undefined as number | undefined,
    idProvincia: undefined as number | undefined,
    idDistrito: undefined as number | undefined,
    latitud: undefined as number | undefined,
    longitud: undefined as number | undefined,
    idArea: undefined as number | undefined,
    idCargo: undefined as number | undefined,
    fechaInicio: '',
    fechaCese: '',
    idUsuarioVinculo: undefined as number | undefined,
    idChofer: undefined as number | undefined,
    correo: '',
    crearUsuario: false,
  },
})

const [nombres, nombresAttrs] = defineField('nombres')
const [apellidoPaterno, apellidoPaternoAttrs] = defineField('apellidoPaterno')
const [apellidoMaterno, apellidoMaternoAttrs] = defineField('apellidoMaterno')
const [idTipoDocumento, idTipoDocumentoAttrs] = defineField('idTipoDocumento')
const [numeroDocumento, numeroDocumentoAttrs] = defineField('numeroDocumento')
const [fechaNacimiento] = defineField('fechaNacimiento')
const [direccion, direccionAttrs] = defineField('direccion')
const [referencia, referenciaAttrs] = defineField('referencia')
const [idPais, idPaisAttrs] = defineField('idPais')
const [idDepartamento, idDepartamentoAttrs] = defineField('idDepartamento')
const [idProvincia, idProvinciaAttrs] = defineField('idProvincia')
const [idDistrito, idDistritoAttrs] = defineField('idDistrito')
const [latitud] = defineField('latitud')
const [longitud] = defineField('longitud')
const [idArea, idAreaAttrs] = defineField('idArea')
const [idCargo, idCargoAttrs] = defineField('idCargo')
const [fechaInicio] = defineField('fechaInicio')
const [fechaCese] = defineField('fechaCese')
const [idUsuarioVinculo] = defineField('idUsuarioVinculo')
const [idChofer] = defineField('idChofer')
const [correo, correoAttrs] = defineField('correo')
const [crearUsuario] = defineField('crearUsuario')

const tipoDocumentoQuery = useListaOpcionesQuery(computed(() => ListaIds.TIPO_DOCUMENTO))
const tipoDocumentoOptions = computed(() => toSelectOptions(tipoDocumentoQuery.data.value))

const tipoDocumentoSeleccionado = computed(() => {
  const opciones = tipoDocumentoQuery.data.value ?? []
  return opciones.find((opcion) => opcion.id === Number(idTipoDocumento.value))
})

const aplicarDatosDni = (data: ConsultaDniData) => {
  if (data.dni) numeroDocumento.value = data.dni
  if (data.nombres) nombres.value = data.nombres
  if (data.apellidoPaterno) apellidoPaterno.value = data.apellidoPaterno
  if (data.apellidoMaterno) apellidoMaterno.value = data.apellidoMaterno
}

const aplicarDatosRuc = (data: ConsultaRucData) => {
  if (data.ruc) numeroDocumento.value = data.ruc
  if (data.razonSocial) nombres.value = data.razonSocial
}

const areaQuery = useListaOpcionesQuery(computed(() => ListaIds.AREAS_TRABAJADOR))
const areaOptions = computed(() => toSelectOptions(areaQuery.data.value))

const cargoQuery = useListaOpcionesQuery(computed(() => ListaIds.CARGOS_TRABAJADOR))
const cargoOptions = computed(() => toSelectOptions(cargoQuery.data.value))

const areaModalOpen = ref(false)
const onAreaCreada = (opcion: ListaOpcion) => {
  idArea.value = opcion.id
}

const cargoModalOpen = ref(false)
const onCargoCreada = (opcion: ListaOpcion) => {
  idCargo.value = opcion.id
}

const paisesQuery = usePaisesQuery()
const paisOptions = computed<SelectOption[]>(
  () => paisesQuery.data.value?.map((p) => ({ value: p.id, label: p.nombre })) ?? [],
)

const idPaisComputed = computed(() => (idPais.value ? Number(idPais.value) : undefined))
const departamentosQuery = useDepartamentosQuery(idPaisComputed)
const departamentoOptions = computed<SelectOption[]>(
  () => departamentosQuery.data.value?.map((d) => ({ value: d.id, label: d.nombre })) ?? [],
)

const idDepartamentoComputed = computed(() =>
  idDepartamento.value ? Number(idDepartamento.value) : undefined,
)
const provinciasQuery = useProvinciasQuery(idDepartamentoComputed)
const provinciaOptions = computed<SelectOption[]>(
  () => provinciasQuery.data.value?.map((p) => ({ value: p.id, label: p.nombre })) ?? [],
)

const idProvinciaComputed = computed(() =>
  idProvincia.value ? Number(idProvincia.value) : undefined,
)
const distritosQuery = useDistritosQuery(idProvinciaComputed)
const distritoOptions = computed<SelectOption[]>(
  () => distritosQuery.data.value?.map((d) => ({ value: d.id, label: d.nombre })) ?? [],
)

const edadCalculada = computed<number | null>(() => {
  const raw = fechaNacimiento.value
  if (!raw) return null
  const nac = new Date(raw)
  if (Number.isNaN(nac.getTime())) return null
  const hoy = new Date()
  let edad = hoy.getFullYear() - nac.getFullYear()
  const m = hoy.getMonth() - nac.getMonth()
  if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) edad--
  return edad
})

const toNum = (v: unknown): number | undefined => {
  if (v === null || v === undefined || v === '') return undefined
  const n = Number(v)
  return Number.isNaN(n) ? undefined : n
}

watch(idPais, () => {
  resetForm({ values: { ...currentValues(), idDepartamento: undefined, idProvincia: undefined, idDistrito: undefined } })
})
watch(idDepartamento, () => {
  resetForm({ values: { ...currentValues(), idProvincia: undefined, idDistrito: undefined } })
})
watch(idProvincia, () => {
  resetForm({ values: { ...currentValues(), idDistrito: undefined } })
})

const resolverCoordenadasDesdeLink = async (link: string) => {
  const { latitud, longitud } = await direccionesService.coordenadasDesdeLink(link)
  return { lat: latitud, lng: longitud }
}

const currentValues = () => ({
  nombres: nombres.value,
  apellidoPaterno: apellidoPaterno.value,
  apellidoMaterno: apellidoMaterno.value,
  idTipoDocumento: idTipoDocumento.value,
  numeroDocumento: numeroDocumento.value,
  fechaNacimiento: fechaNacimiento.value,
  direccion: direccion.value,
  referencia: referencia.value,
  idPais: idPais.value,
  idDepartamento: idDepartamento.value,
  idProvincia: idProvincia.value,
  idDistrito: idDistrito.value,
  latitud: latitud.value,
  longitud: longitud.value,
  idArea: idArea.value,
  idCargo: idCargo.value,
  fechaInicio: fechaInicio.value,
  fechaCese: fechaCese.value,
  idUsuarioVinculo: idUsuarioVinculo.value,
  idChofer: idChofer.value,
  correo: correo.value,
  crearUsuario: crearUsuario.value,
})

const syncFormValues = () => {
  const t = trabajadorActual.value
  resetForm({
    values: {
      nombres: t?.nombres ?? '',
      apellidoPaterno: t?.apellido_paterno ?? '',
      apellidoMaterno: t?.apellido_materno ?? '',
      idTipoDocumento: t?.id_tipo_documento ?? undefined,
      numeroDocumento: t?.numero_documento ?? '',
      fechaNacimiento: t?.fecha_nacimiento ?? '',
      direccion: t?.direccion ?? '',
      referencia: t?.referencia ?? '',
      idPais: t?.id_pais ?? 1,
      idDepartamento: t?.id_departamento ?? undefined,
      idProvincia: t?.id_provincia ?? undefined,
      idDistrito: t?.id_distrito ?? undefined,
      latitud: t?.latitud ?? undefined,
      longitud: t?.longitud ?? undefined,
      idArea: t?.id_area ?? undefined,
      idCargo: t?.id_cargo ?? undefined,
      fechaInicio: t?.fecha_inicio ?? '',
      fechaCese: t?.fecha_cese ?? '',
      idUsuarioVinculo: t?.id_usuario ?? undefined,
      idChofer: t?.id_chofer ?? undefined,
      correo: t?.correo ?? '',
      crearUsuario: false,
    },
  })
}

const handleClose = () => {
  open.value = false
}

const onSubmit = handleSubmit(async (values) => {
  const currentUserId = authStore.user?.id
  if (!currentUserId) return

  try {
    const payload = {
      idUsuarioAuditoria: currentUserId,
      nombres: values.nombres,
      apellidoPaterno: values.apellidoPaterno || undefined,
      apellidoMaterno: values.apellidoMaterno || undefined,
      idTipoDocumento: Number(values.idTipoDocumento),
      numeroDocumento: values.numeroDocumento,
      fechaNacimiento: values.fechaNacimiento || undefined,
      direccion: values.direccion || undefined,
      referencia: values.referencia || undefined,
      idPais: toNum(values.idPais),
      idDepartamento: toNum(values.idDepartamento),
      idProvincia: toNum(values.idProvincia),
      idDistrito: toNum(values.idDistrito),
      latitud: toNum(values.latitud),
      longitud: toNum(values.longitud),
      idArea: toNum(values.idArea),
      idCargo: toNum(values.idCargo),
      fechaInicio: values.fechaInicio || undefined,
      fechaCese: values.fechaCese || undefined,
      idUsuarioVinculo: toNum(values.idUsuarioVinculo),
      idChofer: toNum(values.idChofer),
      correo: values.correo || undefined,
      crearUsuario: values.crearUsuario || false,
    }

    let guardado: Trabajador | undefined
    if (props.mode === 'create') {
      guardado = await createMutation.mutateAsync(payload)
    } else if (props.trabajador) {
      guardado = await updateMutation.mutateAsync({ id: props.trabajador.id, payload })
    } else {
      return
    }

    emit('saved', guardado)
    open.value = false

    if (values.crearUsuario && values.correo) {
      credencialesInfo.value = { correo: values.correo, numeroDocumento: values.numeroDocumento }
      credencialesModalOpen.value = true
    }
  } catch {
    // toast en mutation
  }
})

const credencialesModalOpen = ref(false)
const credencialesInfo = ref<{ correo: string; numeroDocumento: string } | null>(null)

watch(
  () => open.value,
  (isOpen) => {
    if (isOpen) syncFormValues()
  },
)
watch(
  () => trabajadorDetailQuery.data.value,
  () => {
    if (open.value) syncFormValues()
  },
)
watch(
  () => props.trabajador,
  () => {
    if (open.value) syncFormValues()
  },
)
</script>
