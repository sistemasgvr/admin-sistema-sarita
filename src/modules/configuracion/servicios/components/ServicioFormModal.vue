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
      @submit.prevent="handleSubmit"
    >
      <AppInput
        v-model="form.codigo"
        label="Código"
        placeholder="CORREO"
        required
        :disabled="isSubmitting"
        :error="errors.codigo"
      />

      <AppInput
        v-model="form.nombre"
        label="Nombre"
        placeholder="Correo SMTP"
        required
        :disabled="isSubmitting"
        :error="errors.nombre"
      />

      <AppInput
        v-model="form.usuario"
        label="Usuario"
        placeholder="usuario@servicio.com"
        :disabled="isSubmitting"
      />

      <AppInput
        v-model="form.contrasena"
        type="password"
        :label="mode === 'create' ? 'Contraseña' : 'Nueva contraseña'"
        :placeholder="mode === 'create' ? 'Contraseña del servicio' : 'Dejar vacío para no cambiar'"
        name="servicio-contrasena"
        autocomplete="new-password"
        :disabled="isSubmitting"
        :hint="mode === 'edit' ? 'Dejar vacío para mantener la contraseña actual.' : undefined"
      />

      <AppInput
        v-model="form.email"
        type="email"
        label="Correo"
        placeholder="smtp@empresa.com"
        :disabled="isSubmitting"
      />

      <AppInput
        v-model="form.url"
        label="URL"
        placeholder="https://api.servicio.com"
        :disabled="isSubmitting"
      />

      <AppInput
        v-model="form.observacion"
        label="Observación"
        placeholder="Notas adicionales"
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
import { reactive, ref, watch } from 'vue'
import {
  useCreateConfiguracionServicioMutation,
  useUpdateConfiguracionServicioMutation,
} from '@/modules/configuracion/servicios/composables/useConfiguracionServicioMutations'
import type {
  ConfiguracionServicio,
  ConfiguracionServicioFormMode,
} from '@/modules/configuracion/servicios/interfaces/configuracion-servicio.interface'
import { AppInput, AppModal } from '@/shared/components'

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

const form = reactive({
  codigo: '',
  nombre: '',
  usuario: '',
  contrasena: '',
  email: '',
  url: '',
  observacion: '',
})

const errors = reactive({
  codigo: '',
  nombre: '',
})

const isSubmitting = ref(false)

const resetForm = () => {
  form.codigo = props.servicio?.codigo ?? ''
  form.nombre = props.servicio?.nombre ?? ''
  form.usuario = props.servicio?.usuario ?? ''
  form.contrasena = ''
  form.email = props.servicio?.email ?? ''
  form.url = props.servicio?.url ?? ''
  form.observacion = props.servicio?.observacion ?? ''
  errors.codigo = ''
  errors.nombre = ''
}

const validate = () => {
  errors.codigo = ''
  errors.nombre = ''

  if (!form.codigo.trim()) {
    errors.codigo = 'El código es obligatorio'
  }

  if (!form.nombre.trim()) {
    errors.nombre = 'El nombre es obligatorio'
  }

  return !errors.codigo && !errors.nombre
}

const handleClose = () => {
  open.value = false
}

const handleSubmit = async () => {
  if (!validate()) return

  isSubmitting.value = true

  try {
    const basePayload = {
      codigo: form.codigo.trim(),
      nombre: form.nombre.trim(),
      usuario: form.usuario.trim() || undefined,
      email: form.email.trim() || undefined,
      url: form.url.trim() || undefined,
      observacion: form.observacion.trim() || undefined,
    }

    if (props.mode === 'create') {
      await createMutation.mutateAsync({
        ...basePayload,
        contrasena: form.contrasena.trim() || undefined,
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

      if (form.contrasena.trim()) {
        payload.contrasena = form.contrasena
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
  } finally {
    isSubmitting.value = false
  }
}

watch(
  () => open.value,
  (isOpen) => {
    if (isOpen) {
      resetForm()
    }
  },
)

watch(
  () => props.servicio,
  () => {
    if (open.value) {
      resetForm()
    }
  },
)
</script>
