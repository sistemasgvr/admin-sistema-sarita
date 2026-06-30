<template>
  <AppModal
    v-model="open"
    :title="mode === 'create' ? 'Nuevo rol' : 'Editar rol'"
    :subtitle="
      mode === 'create'
        ? 'Registra un nuevo rol del sistema.'
        : 'Actualiza los datos del rol seleccionado.'
    "
    @close="handleClose"
  >
    <form id="rol-form" class="space-y-4" @submit="onSubmit">
      <AppInput
        v-model="nombre"
        label="Nombre"
        placeholder="Ej. Vendedor"
        required
        v-bind="nombreAttrs"
        :disabled="isSubmitting"
        :error="errors.nombre"
      />

      <AppTextarea
        v-model="descripcion"
        label="Descripción"
        placeholder="Describe el propósito del rol"
        v-bind="descripcionAttrs"
        :disabled="isSubmitting"
        :error="errors.descripcion"
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
        form="rol-form"
        class="flex w-full justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
        :disabled="isSubmitting"
      >
        {{ isSubmitting ? 'Guardando...' : mode === 'create' ? 'Crear rol' : 'Guardar cambios' }}
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
  useCreateRolMutation,
  useUpdateRolMutation,
} from '@/modules/roles/composables/useRolMutations'
import type { Rol, RolFormMode } from '@/modules/roles/interfaces/rol.interface'
import { AppInput, AppModal, AppTextarea } from '@/shared/components'
import { optionalString, requiredString } from '@/shared/validation'

interface RolFormModalProps {
  mode: RolFormMode
  rol?: Rol | null
}

const props = defineProps<RolFormModalProps>()

const open = defineModel<boolean>({ default: false })

const emit = defineEmits<{
  saved: []
}>()

const createMutation = useCreateRolMutation()
const updateMutation = useUpdateRolMutation()

const { defineField, handleSubmit, resetForm, errors, isSubmitting } = useForm({
  validationSchema: toTypedSchema(
    yup.object({
      nombre: requiredString('El nombre'),
      descripcion: optionalString(),
    }),
  ),
  initialValues: {
    nombre: '',
    descripcion: '',
  },
})

const [nombre, nombreAttrs] = defineField('nombre')
const [descripcion, descripcionAttrs] = defineField('descripcion')

const syncFormValues = () => {
  resetForm({
    values: {
      nombre: props.rol?.nombre ?? '',
      descripcion: props.rol?.descripcion ?? '',
    },
  })
}

const handleClose = () => {
  open.value = false
}

const onSubmit = handleSubmit(async (values) => {
  try {
    if (props.mode === 'create') {
      await createMutation.mutateAsync({
        nombre: values.nombre,
        descripcion: values.descripcion || undefined,
      })
    } else if (props.rol) {
      await updateMutation.mutateAsync({
        id: props.rol.id,
        payload: {
          nombre: values.nombre,
          descripcion: values.descripcion || undefined,
        },
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
  () => props.rol,
  () => {
    if (open.value) {
      syncFormValues()
    }
  },
)
</script>
