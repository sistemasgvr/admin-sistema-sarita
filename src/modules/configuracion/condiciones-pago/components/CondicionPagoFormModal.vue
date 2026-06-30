<template>
  <AppModal
    v-model="open"
    :title="mode === 'create' ? 'Nueva condición de pago' : 'Editar condición de pago'"
    :subtitle="
      mode === 'create'
        ? 'Registra una nueva condición de pago.'
        : 'Actualiza los datos de la condición seleccionada.'
    "
    size="lg"
    @close="handleClose"
  >
    <form
      id="condicion-pago-form"
      class="space-y-4"
      autocomplete="off"
      @submit="onSubmit"
    >
      <AppInput
        v-model="codigo"
        label="Código"
        placeholder="CONTADO"
        required
        v-bind="codigoAttrs"
        :disabled="isSubmitting"
        :error="errors.codigo"
      />

      <AppInput
        v-model="nombre"
        label="Nombre"
        placeholder="Contado"
        required
        v-bind="nombreAttrs"
        :disabled="isSubmitting"
        :error="errors.nombre"
      />

      <AppInput
        v-model="dias_credito"
        type="number"
        label="Días de crédito"
        placeholder="0"
        required
        v-bind="diasCreditoAttrs"
        :disabled="isSubmitting"
        :error="errors.dias_credito"
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
        form="condicion-pago-form"
        class="flex w-full justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
        :disabled="isSubmitting"
      >
        {{
          isSubmitting
            ? 'Guardando...'
            : mode === 'create'
              ? 'Crear condición'
              : 'Guardar cambios'
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
  useCreateCondicionPagoMutation,
  useUpdateCondicionPagoMutation,
} from '@/modules/configuracion/condiciones-pago/composables/useCondicionPagoMutations'
import type {
  CondicionPago,
  CondicionPagoFormMode,
} from '@/modules/configuracion/condiciones-pago/interfaces/condicion-pago.interface'
import { AppInput, AppModal } from '@/shared/components'
import { nonNegativeNumber, requiredString } from '@/shared/validation'

interface CondicionPagoFormModalProps {
  mode: CondicionPagoFormMode
  condicionPago?: CondicionPago | null
}

const props = defineProps<CondicionPagoFormModalProps>()

const open = defineModel<boolean>({ default: false })

const emit = defineEmits<{
  saved: []
}>()

const createMutation = useCreateCondicionPagoMutation()
const updateMutation = useUpdateCondicionPagoMutation()

const { defineField, handleSubmit, resetForm, errors, isSubmitting } = useForm({
  validationSchema: toTypedSchema(
    yup.object({
      codigo: requiredString('El código'),
      nombre: requiredString('El nombre'),
      dias_credito: nonNegativeNumber(),
    }),
  ),
  initialValues: {
    codigo: '',
    nombre: '',
    dias_credito: 0,
  },
})

const [codigo, codigoAttrs] = defineField('codigo')
const [nombre, nombreAttrs] = defineField('nombre')
const [dias_credito, diasCreditoAttrs] = defineField('dias_credito')

const syncFormValues = () => {
  resetForm({
    values: {
      codigo: props.condicionPago?.codigo ?? '',
      nombre: props.condicionPago?.nombre ?? '',
      dias_credito: props.condicionPago?.dias_credito ?? 0,
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
      diasCredito: values.dias_credito,
    }

    if (props.mode === 'create') {
      await createMutation.mutateAsync(payload)
    } else if (props.condicionPago) {
      await updateMutation.mutateAsync({
        id: props.condicionPago.id,
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
  () => props.condicionPago,
  () => {
    if (open.value) {
      syncFormValues()
    }
  },
)
</script>
