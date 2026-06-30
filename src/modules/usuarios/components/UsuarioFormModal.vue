<template>
  <AppModal
    v-model="open"
    :title="mode === 'create' ? 'Nuevo usuario' : 'Editar usuario'"
    :subtitle="
      mode === 'create'
        ? 'Registra un nuevo usuario del sistema.'
        : 'Actualiza los datos del usuario seleccionado.'
    "
    @close="handleClose"
  >
    <form id="usuario-form" class="space-y-4" @submit.prevent="handleSubmit">
      <AppInput
        v-model="form.nombre"
        label="Nombre"
        placeholder="Nombre completo"
        required
        :disabled="isSubmitting"
        :error="errors.nombre"
      />

      <AppInput
        v-model="form.correo"
        type="email"
        label="Correo"
        placeholder="correo@ejemplo.com"
        autocomplete="email"
        required
        :disabled="isSubmitting"
        :error="errors.correo"
      />

      <AppInput
        v-model="form.contrasena"
        type="password"
        :label="mode === 'create' ? 'Contraseña' : 'Nueva contraseña'"
        :placeholder="mode === 'create' ? 'Mínimo 6 caracteres' : 'Dejar vacío para no cambiar'"
        :required="mode === 'create'"
        :disabled="isSubmitting"
        :error="errors.contrasena"
        :hint="mode === 'edit' ? 'Solo completa si deseas cambiar la contraseña.' : undefined"
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
        form="usuario-form"
        class="flex w-full justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
        :disabled="isSubmitting"
      >
        {{ isSubmitting ? 'Guardando...' : mode === 'create' ? 'Crear usuario' : 'Guardar cambios' }}
      </button>
    </template>
  </AppModal>
</template>

<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import {
  useCreateUsuarioMutation,
  useUpdateUsuarioMutation,
} from '@/modules/usuarios/composables/useUsuarioMutations'
import type {
  Usuario,
  UsuarioFormMode,
} from '@/modules/usuarios/interfaces/usuario.interface'
import { AppInput, AppModal } from '@/shared/components'

interface UsuarioFormModalProps {
  mode: UsuarioFormMode
  usuario?: Usuario | null
}

const props = defineProps<UsuarioFormModalProps>()

const open = defineModel<boolean>({ default: false })

const emit = defineEmits<{
  saved: []
}>()

const createMutation = useCreateUsuarioMutation()
const updateMutation = useUpdateUsuarioMutation()

const form = reactive({
  nombre: '',
  correo: '',
  contrasena: '',
})

const errors = reactive({
  nombre: '',
  correo: '',
  contrasena: '',
})

const isSubmitting = ref(false)

const resetForm = () => {
  form.nombre = props.usuario?.nombre ?? ''
  form.correo = props.usuario?.correo ?? ''
  form.contrasena = ''
  errors.nombre = ''
  errors.correo = ''
  errors.contrasena = ''
}

const validate = () => {
  errors.nombre = ''
  errors.correo = ''
  errors.contrasena = ''

  if (!form.nombre.trim()) {
    errors.nombre = 'El nombre es obligatorio'
  }

  if (!form.correo.trim()) {
    errors.correo = 'El correo es obligatorio'
  }

  if (props.mode === 'create' && form.contrasena.length < 6) {
    errors.contrasena = 'La contraseña debe tener al menos 6 caracteres'
  }

  if (props.mode === 'edit' && form.contrasena && form.contrasena.length < 6) {
    errors.contrasena = 'La contraseña debe tener al menos 6 caracteres'
  }

  return !errors.nombre && !errors.correo && !errors.contrasena
}

const handleClose = () => {
  open.value = false
}

const handleSubmit = async () => {
  if (!validate()) return

  isSubmitting.value = true

  try {
    if (props.mode === 'create') {
      await createMutation.mutateAsync({
        nombre: form.nombre.trim(),
        correo: form.correo.trim(),
        contrasena: form.contrasena,
      })
    } else if (props.usuario) {
      const payload: {
        nombre: string
        correo: string
        contrasena?: string
      } = {
        nombre: form.nombre.trim(),
        correo: form.correo.trim(),
      }

      if (form.contrasena.trim()) {
        payload.contrasena = form.contrasena
      }

      await updateMutation.mutateAsync({
        id: props.usuario.id,
        payload,
      })
    }

    emit('saved')
    open.value = false
  } catch {
    // El toast lo maneja la mutation
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
  () => props.usuario,
  () => {
    if (open.value) {
      resetForm()
    }
  },
)
</script>
