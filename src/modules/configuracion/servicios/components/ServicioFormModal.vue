<template>
  <AppModal
    v-model="open"
    :title="mode === 'create' ? 'Nuevo servicio externo' : 'Editar servicio externo'"
    :subtitle="
      mode === 'create'
        ? 'Registra la configuración de un servicio externo.'
        : 'Actualiza la configuración del servicio seleccionado.'
    "
    size="lg"
    @close="handleClose"
  >
    <form
      id="servicio-form"
      class="space-y-4"
      autocomplete="off"
      @submit="onSubmit"
    >
      <AppInput
        v-model="codigo"
        label="Código"
        placeholder="CORREO"
        required
        v-bind="codigoAttrs"
        :disabled="isSubmitting"
        :error="errors.codigo"
      />

      <AppInput
        v-model="nombre"
        label="Nombre"
        placeholder="Correo SMTP"
        required
        v-bind="nombreAttrs"
        :disabled="isSubmitting"
        :error="errors.nombre"
      />

      <AppInput
        v-model="usuario"
        label="Usuario"
        placeholder="usuario@servicio.com"
        v-bind="usuarioAttrs"
        :disabled="isSubmitting"
      />

      <AppInput
        v-model="contrasena"
        type="password"
        :label="mode === 'create' ? 'Contraseña' : 'Nueva contraseña'"
        :placeholder="mode === 'create' ? 'Contraseña del servicio' : 'Dejar vacío para no cambiar'"
        name="servicio-contrasena"
        autocomplete="new-password"
        v-bind="contrasenaAttrs"
        :disabled="isSubmitting"
        :hint="mode === 'edit' ? 'Dejar vacío para mantener la contraseña actual.' : undefined"
      />

      <AppInput
        v-model="email"
        type="email"
        label="Correo"
        placeholder="smtp@empresa.com"
        v-bind="emailAttrs"
        :disabled="isSubmitting"
        :error="errors.email"
      />

      <AppInput
        v-model="url"
        label="URL"
        placeholder="https://api.servicio.com"
        v-bind="urlAttrs"
        :disabled="isSubmitting"
      />

      <AppInput
        v-model="observacion"
        label="Observación"
        placeholder="Notas adicionales"
        v-bind="observacionAttrs"
        :disabled="isSubmitting"
      />
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
        form="servicio-form"
        class="flex w-full justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
        :disabled="isSubmitting"
      >
        {{
          isSubmitting ? 'Guardando...' : mode === 'create' ? 'Crear servicio' : 'Guardar cambios'
        }}
      </button>
    </template>
  </AppModal>
</template>

<script setup lang="ts">
import { watch } from 'vue'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/yup'
import * as yup from 'yup'
import {
  useCreateConfiguracionServicioMutation,
  useUpdateConfiguracionServicioMutation,
} from '@/modules/configuracion/servicios/composables/useConfiguracionServicioMutations'
import type {
  ConfiguracionServicio,
  ConfiguracionServicioFormMode,
} from '@/modules/configuracion/servicios/interfaces/configuracion-servicio.interface'
import { AppInput, AppModal } from '@/shared/components'
import { optionalEmail, optionalPasswordMin, optionalString, requiredString } from '@/shared/validation'

interface ServicioFormModalProps {
  mode: ConfiguracionServicioFormMode
  servicio?: ConfiguracionServicio | null
}

const props = defineProps<ServicioFormModalProps>()

const open = defineModel<boolean>({ default: false })

const emit = defineEmits<{
  saved: []
}>()

const createMutation = useCreateConfiguracionServicioMutation()
const updateMutation = useUpdateConfiguracionServicioMutation()

const { defineField, handleSubmit, resetForm, errors, isSubmitting } = useForm({
  validationSchema: toTypedSchema(
    yup.object({
      codigo: requiredString('El código'),
      nombre: requiredString('El nombre'),
      usuario: optionalString(),
      contrasena: optionalPasswordMin(),
      email: optionalEmail(),
      url: optionalString(),
      observacion: optionalString(),
    }),
  ),
  initialValues: {
    codigo: '',
    nombre: '',
    usuario: '',
    contrasena: '',
    email: '',
    url: '',
    observacion: '',
  },
})

const [codigo, codigoAttrs] = defineField('codigo')
const [nombre, nombreAttrs] = defineField('nombre')
const [usuario, usuarioAttrs] = defineField('usuario')
const [contrasena, contrasenaAttrs] = defineField('contrasena')
const [email, emailAttrs] = defineField('email')
const [url, urlAttrs] = defineField('url')
const [observacion, observacionAttrs] = defineField('observacion')

const syncFormValues = () => {
  resetForm({
    values: {
      codigo: props.servicio?.codigo ?? '',
      nombre: props.servicio?.nombre ?? '',
      usuario: props.servicio?.usuario ?? '',
      contrasena: '',
      email: props.servicio?.email ?? '',
      url: props.servicio?.url ?? '',
      observacion: props.servicio?.observacion ?? '',
    },
  })
}

const handleClose = () => {
  open.value = false
}

const onSubmit = handleSubmit(async (values) => {
  try {
    const basePayload = {
      codigo: values.codigo,
      nombre: values.nombre,
      usuario: values.usuario || undefined,
      email: values.email || undefined,
      url: values.url || undefined,
      observacion: values.observacion || undefined,
    }

    if (props.mode === 'create') {
      await createMutation.mutateAsync({
        ...basePayload,
        contrasena: values.contrasena || undefined,
      })
    } else if (props.servicio) {
      const payload: {
        codigo: string
        nombre: string
        usuario?: string
        contrasena?: string
        email?: string
        url?: string
        observacion?: string
      } = { ...basePayload }

      if (values.contrasena) {
        payload.contrasena = values.contrasena
      }

      await updateMutation.mutateAsync({
        id: props.servicio.id,
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
  () => props.servicio,
  () => {
    if (open.value) {
      syncFormValues()
    }
  },
)
</script>
