<template>
  <AppModal
    v-model="open"
    :title="mode === 'create' ? 'Nueva categoría' : 'Editar categoría'"
    :subtitle="
      mode === 'create'
        ? 'Agrupa productos por tipo (gases, accesorios, etc.).'
        : 'Actualiza los datos de la categoría seleccionada.'
    "
    size="md"
    @close="handleClose"
  >
    <form
      id="categoria-producto-form"
      class="space-y-4"
      autocomplete="off"
      @submit="onSubmit"
    >
      <AppInput
        v-model="nombre"
        label="Nombre"
        placeholder="Gases"
        required
        v-bind="nombreAttrs"
        :disabled="isSubmitting"
        :error="errors.nombre"
      />

      <AppTextarea
        v-model="descripcion"
        label="Descripción"
        placeholder="Descripción opcional"
        v-bind="descripcionAttrs"
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
        form="categoria-producto-form"
        class="flex w-full justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
        :disabled="isSubmitting"
      >
        {{ isSubmitting ? 'Guardando...' : mode === 'create' ? 'Crear categoría' : 'Guardar cambios' }}
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
  useCreateCategoriaProductoMutation,
  useUpdateCategoriaProductoMutation,
} from '@/modules/productos/categorias/composables/useCategoriaProductoMutations'
import type {
  CategoriaProducto,
  CategoriaProductoFormMode,
} from '@/modules/productos/categorias/interfaces/categoria-producto.interface'
import { AppInput, AppModal, AppTextarea } from '@/shared/components'
import { optionalString, requiredString } from '@/shared/validation'

interface CategoriaProductoFormModalProps {
  mode: CategoriaProductoFormMode
  categoria?: CategoriaProducto | null
}

const props = defineProps<CategoriaProductoFormModalProps>()

const open = defineModel<boolean>({ default: false })

const emit = defineEmits<{
  saved: []
}>()

const createMutation = useCreateCategoriaProductoMutation()
const updateMutation = useUpdateCategoriaProductoMutation()

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
      nombre: props.categoria?.nombre ?? '',
      descripcion: props.categoria?.descripcion ?? '',
    },
  })
}

const handleClose = () => {
  open.value = false
}

const onSubmit = handleSubmit(async (values) => {
  try {
    const payload = {
      nombre: values.nombre,
      descripcion: values.descripcion || undefined,
    }

    if (props.mode === 'create') {
      await createMutation.mutateAsync(payload)
    } else if (props.categoria) {
      await updateMutation.mutateAsync({
        id: props.categoria.id,
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
  () => props.categoria,
  () => {
    if (open.value) {
      syncFormValues()
    }
  },
)
</script>
