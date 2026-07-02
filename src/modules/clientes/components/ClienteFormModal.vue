<template>
  <AppModal
    v-model="open"
    :title="mode === 'create' ? 'Nuevo cliente' : 'Editar cliente'"
    :subtitle="
      mode === 'create'
        ? 'Registra un nuevo cliente en el sistema.'
        : 'Actualiza los datos del cliente seleccionado.'
    "
    size="xl"
    @close="handleClose"
  >
    <form
      id="cliente-form"
      class="space-y-6"
      autocomplete="off"
      @submit="onSubmit"
    >
      <div class="space-y-4">
        <h5 class="text-sm font-semibold text-gray-800 dark:text-white/90">Documento</h5>

        <div class="grid gap-4 sm:grid-cols-3">
          <AppInput
            v-model="idTipoDocumento"
            type="number"
            label="Tipo de documento (ID)"
            placeholder="1"
            required
            v-bind="idTipoDocumentoAttrs"
            :disabled="isSubmitting"
            :error="errors.idTipoDocumento"
          />

          <AppInput
            v-model="numeroDocumento"
            label="Número de documento"
            placeholder="12345678"
            required
            v-bind="numeroDocumentoAttrs"
            :disabled="isSubmitting"
            :error="errors.numeroDocumento"
            @blur="checkDocumento"
          />

          <AppInput
            v-model="codigoInterno"
            label="Código interno"
            placeholder="Opcional"
            v-bind="codigoInternoAttrs"
            :disabled="isSubmitting"
            :error="errors.codigoInterno"
          />
        </div>

        <p v-if="isCheckingDocumento" class="text-theme-xs text-gray-400">
          Verificando documento...
        </p>
      </div>

      <div class="space-y-4 border-t border-gray-100 pt-5 dark:border-gray-800">
        <h5 class="text-sm font-semibold text-gray-800 dark:text-white/90">Datos generales</h5>

        <div class="grid gap-4 sm:grid-cols-2">
          <AppInput
            v-model="idTipoCliente"
            type="number"
            label="Tipo de cliente (ID)"
            placeholder="1"
            required
            v-bind="idTipoClienteAttrs"
            :disabled="isSubmitting"
            :error="errors.idTipoCliente"
          />

          <AppInput
            v-model="idTipoPersona"
            type="number"
            label="Tipo de persona (ID)"
            placeholder="1 = Natural, 2 = Jurídica"
            required
            v-bind="idTipoPersonaAttrs"
            :disabled="isSubmitting"
            :error="errors.idTipoPersona"
          />
        </div>

        <AppInput
          v-model="razonSocial"
          label="Razón social"
          placeholder="Comercial Los Andes S.A.C."
          v-bind="razonSocialAttrs"
          :disabled="isSubmitting"
          :error="errors.razonSocial"
          hint="Requerido para personas jurídicas."
        />

        <div class="grid gap-4 sm:grid-cols-3">
          <AppInput
            v-model="nombres"
            label="Nombres"
            placeholder="Juan"
            v-bind="nombresAttrs"
            :disabled="isSubmitting"
            :error="errors.nombres"
          />

          <AppInput
            v-model="apellidoPaterno"
            label="Apellido paterno"
            v-bind="apellidoPaternoAttrs"
            :disabled="isSubmitting"
            :error="errors.apellidoPaterno"
          />

          <AppInput
            v-model="apellidoMaterno"
            label="Apellido materno"
            v-bind="apellidoMaternoAttrs"
            :disabled="isSubmitting"
            :error="errors.apellidoMaterno"
          />
        </div>
      </div>

      <div class="space-y-4 border-t border-gray-100 pt-5 dark:border-gray-800">
        <h5 class="text-sm font-semibold text-gray-800 dark:text-white/90">Contacto y ubicación</h5>

        <div class="grid gap-4 sm:grid-cols-2">
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

        <div class="grid gap-4 sm:grid-cols-4">
          <AppInput
            v-model="idPais"
            type="number"
            label="País (ID)"
            v-bind="idPaisAttrs"
            :disabled="isSubmitting"
            :error="errors.idPais"
          />
          <AppInput
            v-model="idDepartamento"
            type="number"
            label="Departamento (ID)"
            v-bind="idDepartamentoAttrs"
            :disabled="isSubmitting"
            :error="errors.idDepartamento"
          />
          <AppInput
            v-model="idProvincia"
            type="number"
            label="Provincia (ID)"
            v-bind="idProvinciaAttrs"
            :disabled="isSubmitting"
            :error="errors.idProvincia"
          />
          <AppInput
            v-model="idDistrito"
            type="number"
            label="Distrito (ID)"
            v-bind="idDistritoAttrs"
            :disabled="isSubmitting"
            :error="errors.idDistrito"
          />
        </div>
      </div>

      <div class="space-y-4 border-t border-gray-100 pt-5 dark:border-gray-800">
        <h5 class="text-sm font-semibold text-gray-800 dark:text-white/90">Configuración SUNAT</h5>

        <div class="grid gap-3 sm:grid-cols-2">
          <AppCheckbox v-model="esAgentePercepcion" label="Agente de percepción" :disabled="isSubmitting" />
          <AppCheckbox v-model="esBuenContribuyente" label="Buen contribuyente" :disabled="isSubmitting" />
          <AppCheckbox v-model="esAgenteRetenedor" label="Agente retenedor" :disabled="isSubmitting" />
          <AppCheckbox v-model="afectoRus" label="Afecto a RUS" :disabled="isSubmitting" />
        </div>

        <div class="grid gap-4 sm:grid-cols-2">
          <AppInput
            v-model="situacionSunat"
            label="Situación SUNAT"
            placeholder="ACTIVO"
            v-bind="situacionSunatAttrs"
            :disabled="isSubmitting"
            :error="errors.situacionSunat"
          />
          <AppInput
            v-model="estadoContribuyenteSunat"
            label="Estado contribuyente SUNAT"
            placeholder="HABIDO"
            v-bind="estadoContribuyenteSunatAttrs"
            :disabled="isSubmitting"
            :error="errors.estadoContribuyenteSunat"
          />
        </div>
      </div>

      <div class="border-t border-gray-100 pt-5 dark:border-gray-800">
        <AppTextarea
          v-model="observacion"
          label="Observación"
          placeholder="Notas adicionales sobre el cliente"
          v-bind="observacionAttrs"
          :disabled="isSubmitting"
          :error="errors.observacion"
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
        form="cliente-form"
        class="flex w-full justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
        :disabled="isSubmitting"
      >
        {{ isSubmitting ? 'Guardando...' : mode === 'create' ? 'Crear cliente' : 'Guardar cambios' }}
      </button>
    </template>
  </AppModal>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/yup'
import * as yup from 'yup'
import {
  useCreateClienteMutation,
  useUpdateClienteMutation,
} from '@/modules/clientes/composables/useClienteMutations'
import { documentoYaRegistrado } from '@/modules/clientes/composables/useValidarDocumentoCliente'
import type {
  Cliente,
  ClienteFormMode,
  ClientePayload,
} from '@/modules/clientes/interfaces/cliente.interface'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { AppCheckbox, AppInput, AppModal, AppTextarea } from '@/shared/components'
import { optionalEmail, optionalString, requiredSelect, requiredString } from '@/shared/validation'

interface ClienteFormModalProps {
  mode: ClienteFormMode
  cliente?: Cliente | null
}

const props = defineProps<ClienteFormModalProps>()

const open = defineModel<boolean>({ default: false })

const emit = defineEmits<{
  saved: []
}>()

const authStore = useAuthStore()
const createMutation = useCreateClienteMutation()
const updateMutation = useUpdateClienteMutation()

const isCheckingDocumento = ref(false)
const documentoDuplicado = ref(false)

const validationSchema = toTypedSchema(
  yup.object({
    idTipoDocumento: requiredSelect('El tipo de documento'),
    numeroDocumento: requiredString('El número de documento'),
    codigoInterno: optionalString(),
    idTipoCliente: requiredSelect('El tipo de cliente'),
    idTipoPersona: requiredSelect('El tipo de persona'),
    razonSocial: optionalString(),
    nombres: optionalString(),
    apellidoPaterno: optionalString(),
    apellidoMaterno: optionalString(),
    telefono: optionalString(),
    email: optionalEmail(),
    direccion: optionalString(),
    referencia: optionalString(),
    idPais: yup.number().transform((v, o) => (o === '' ? undefined : v)).optional(),
    idDepartamento: yup.number().transform((v, o) => (o === '' ? undefined : v)).optional(),
    idProvincia: yup.number().transform((v, o) => (o === '' ? undefined : v)).optional(),
    idDistrito: yup.number().transform((v, o) => (o === '' ? undefined : v)).optional(),
    situacionSunat: optionalString(),
    estadoContribuyenteSunat: optionalString(),
    observacion: optionalString(),
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
    nombres: '',
    apellidoPaterno: '',
    apellidoMaterno: '',
    telefono: '',
    email: '',
    direccion: '',
    referencia: '',
    idPais: undefined,
    idDepartamento: undefined,
    idProvincia: undefined,
    idDistrito: undefined,
    situacionSunat: '',
    estadoContribuyenteSunat: '',
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
const [idPais, idPaisAttrs] = defineField('idPais')
const [idDepartamento, idDepartamentoAttrs] = defineField('idDepartamento')
const [idProvincia, idProvinciaAttrs] = defineField('idProvincia')
const [idDistrito, idDistritoAttrs] = defineField('idDistrito')
const [situacionSunat, situacionSunatAttrs] = defineField('situacionSunat')
const [estadoContribuyenteSunat, estadoContribuyenteSunatAttrs] = defineField(
  'estadoContribuyenteSunat',
)
const [observacion, observacionAttrs] = defineField('observacion')

const esAgentePercepcion = ref(false)
const esBuenContribuyente = ref(false)
const esAgenteRetenedor = ref(false)
const afectoRus = ref(false)

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

const syncFormValues = () => {
  resetForm({
    values: {
      idTipoDocumento: props.cliente?.id_tipo_documento ?? '',
      numeroDocumento: props.cliente?.numero_documento ?? '',
      codigoInterno: props.cliente?.codigo_interno ?? '',
      idTipoCliente: props.cliente?.id_tipo_cliente ?? '',
      idTipoPersona: props.cliente?.id_tipo_persona ?? '',
      razonSocial: props.cliente?.razon_social ?? '',
      nombres: props.cliente?.nombres ?? '',
      apellidoPaterno: props.cliente?.apellido_paterno ?? '',
      apellidoMaterno: props.cliente?.apellido_materno ?? '',
      telefono: props.cliente?.telefono ?? '',
      email: props.cliente?.email ?? '',
      direccion: props.cliente?.direccion ?? '',
      referencia: props.cliente?.referencia ?? '',
      idPais: props.cliente?.id_pais ?? undefined,
      idDepartamento: props.cliente?.id_departamento ?? undefined,
      idProvincia: props.cliente?.id_provincia ?? undefined,
      idDistrito: props.cliente?.id_distrito ?? undefined,
      situacionSunat: props.cliente?.situacion_sunat ?? '',
      estadoContribuyenteSunat: props.cliente?.estado_contribuyente_sunat ?? '',
      observacion: props.cliente?.observacion ?? '',
    },
  })

  esAgentePercepcion.value = props.cliente?.es_agente_percepcion ?? false
  esBuenContribuyente.value = props.cliente?.es_buen_contribuyente ?? false
  esAgenteRetenedor.value = props.cliente?.es_agente_retenedor ?? false
  afectoRus.value = props.cliente?.afecto_rus ?? false
  documentoDuplicado.value = false
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
    numeroDocumento: values.numeroDocumento,
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
    idPais: values.idPais ? Number(values.idPais) : undefined,
    idDepartamento: values.idDepartamento ? Number(values.idDepartamento) : undefined,
    idProvincia: values.idProvincia ? Number(values.idProvincia) : undefined,
    idDistrito: values.idDistrito ? Number(values.idDistrito) : undefined,
    esAgentePercepcion: esAgentePercepcion.value,
    esBuenContribuyente: esBuenContribuyente.value,
    esAgenteRetenedor: esAgenteRetenedor.value,
    afectoRus: afectoRus.value,
    situacionSunat: values.situacionSunat || undefined,
    estadoContribuyenteSunat: values.estadoContribuyenteSunat || undefined,
    observacion: values.observacion || undefined,
  }

  try {
    if (props.mode === 'create') {
      await createMutation.mutateAsync(payload)
    } else if (props.cliente) {
      await updateMutation.mutateAsync({
        id: props.cliente.id,
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
  () => props.cliente,
  () => {
    if (open.value) {
      syncFormValues()
    }
  },
)
</script>
