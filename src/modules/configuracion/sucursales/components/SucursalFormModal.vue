<template>
  <AppModal
    v-model="open"
    :title="mode === 'create' ? 'Nueva sucursal' : 'Editar sucursal'"
    :subtitle="
      mode === 'create'
        ? 'Registra una nueva sucursal.'
        : 'Actualiza los datos de la sucursal seleccionada.'
    "
    size="lg"
    @close="handleClose"
  >
    <form
      id="sucursal-form"
      class="space-y-4"
      autocomplete="off"
      @submit="onSubmit"
    >
      <AppInput
        v-model="codigo"
        label="Código"
        placeholder="SUC-001"
        required
        v-bind="codigoAttrs"
        :disabled="isSubmitting"
        :error="errors.codigo"
      />

      <AppInput
        v-model="nombre"
        label="Nombre"
        placeholder="Sucursal Principal"
        required
        v-bind="nombreAttrs"
        :disabled="isSubmitting"
        :error="errors.nombre"
      />

      <AppInput
        v-model="direccion"
        label="Dirección"
        placeholder="Av. Principal 123"
        v-bind="direccionAttrs"
        :disabled="isSubmitting"
      />

      <AppInput
        v-model="telefono"
        label="Teléfono"
        placeholder="999 999 999"
        v-bind="telefonoAttrs"
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
        form="sucursal-form"
        class="flex w-full justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
        :disabled="isSubmitting"
      >
        {{ isSubmitting ? 'Guardando...' : mode === 'create' ? 'Crear sucursal' : 'Guardar cambios' }}
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
  useCreateSucursalMutation,
  useUpdateSucursalMutation,
} from '@/modules/configuracion/sucursales/composables/useSucursalMutations'
import type {
  Sucursal,
  SucursalFormMode,
} from '@/modules/configuracion/sucursales/interfaces/sucursal.interface'
import { AppInput, AppModal } from '@/shared/components'
import { optionalString, requiredString } from '@/shared/validation'

interface SucursalFormModalProps {
  mode: SucursalFormMode
  sucursal?: Sucursal | null
}

const props = defineProps<SucursalFormModalProps>()

const open = defineModel<boolean>({ default: false })

const emit = defineEmits<{
  saved: []
}>()

const createMutation = useCreateSucursalMutation()
const updateMutation = useUpdateSucursalMutation()

const { defineField, handleSubmit, resetForm, errors, isSubmitting } = useForm({
  validationSchema: toTypedSchema(
    yup.object({
      codigo: requiredString('El código'),
      nombre: requiredString('El nombre'),
      direccion: optionalString(),
      telefono: optionalString(),
    }),
  ),
  initialValues: {
    codigo: '',
    nombre: '',
    direccion: '',
    telefono: '',
  },
})

const [codigo, codigoAttrs] = defineField('codigo')
const [nombre, nombreAttrs] = defineField('nombre')
const [direccion, direccionAttrs] = defineField('direccion')
const [telefono, telefonoAttrs] = defineField('telefono')

const syncFormValues = () => {
  resetForm({
    values: {
      codigo: props.sucursal?.codigo ?? '',
      nombre: props.sucursal?.nombre ?? '',
      direccion: props.sucursal?.direccion ?? '',
      telefono: props.sucursal?.telefono ?? '',
    },
  })
}

const handleClose = () => {
  open.value = false
}

const onSubmit = handleSubmit(async (values) => {
  try {
    const payload = {
      codigo: values.codigo,
      nombre: values.nombre,
      direccion: values.direccion || undefined,
      telefono: values.telefono || undefined,
    }

    if (props.mode === 'create') {
      await createMutation.mutateAsync(payload)
    } else if (props.sucursal) {
      await updateMutation.mutateAsync({
        id: props.sucursal.id,
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
  () => props.sucursal,
  () => {
    if (open.value) {
      syncFormValues()
    }
  },
)
</script>
