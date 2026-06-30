<template>
  <AppModal
    v-model="open"
    :title="mode === 'create' ? 'Nuevo permiso' : 'Editar permiso'"
    :subtitle="
      mode === 'create'
        ? 'Registra una nueva bandera de permiso.'
        : 'Actualiza los datos del permiso seleccionado.'
    "
    @close="handleClose"
  >
    <form id="permiso-form" class="space-y-4" @submit="onSubmit">
      <AppInput
        v-model="nombre"
        label="Nombre"
        placeholder="Ej. usuarios.crear"
        required
        v-bind="nombreAttrs"
        :disabled="isSubmitting"
        :error="errors.nombre"
        hint="Usa el formato módulo.acción, por ejemplo clientes.listar."
      />

      <AppTextarea
        v-model="descripcion"
        label="Descripción"
        placeholder="Describe qué permite este permiso"
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
        form="permiso-form"
        class="flex w-full justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
        :disabled="isSubmitting"
      >
        {{ isSubmitting ? 'Guardando...' : mode === 'create' ? 'Crear permiso' : 'Guardar cambios' }}
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
  useCreatePermisoMutation,
  useUpdatePermisoMutation,
} from '@/modules/permisos/composables/usePermisoMutations'
import type {
  Permiso,
  PermisoFormMode,
} from '@/modules/permisos/interfaces/permiso.interface'
import { AppInput, AppModal, AppTextarea } from '@/shared/components'
import { optionalString, requiredString } from '@/shared/validation'

interface PermisoFormModalProps {
  mode: PermisoFormMode
  permiso?: Permiso | null
}

const props = defineProps<PermisoFormModalProps>()

const open = defineModel<boolean>({ default: false })

const emit = defineEmits<{
  saved: []
}>()

const createMutation = useCreatePermisoMutation()
const updateMutation = useUpdatePermisoMutation()

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
      nombre: props.permiso?.nombre ?? '',
      descripcion: props.permiso?.descripcion ?? '',
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
    } else if (props.permiso) {
      await updateMutation.mutateAsync({
        id: props.permiso.id,
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
  () => props.permiso,
  () => {
    if (open.value) {
      syncFormValues()
    }
  },
)
</script>
