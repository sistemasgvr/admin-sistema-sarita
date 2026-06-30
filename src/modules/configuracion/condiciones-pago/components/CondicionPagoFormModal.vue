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
      @submit.prevent="handleSubmit"
    >
      <AppInput
        v-model="form.codigo"
        label="Código"
        placeholder="CONTADO"
        required
        :disabled="isSubmitting"
        :error="errors.codigo"
      />

      <AppInput
        v-model="form.nombre"
        label="Nombre"
        placeholder="Contado"
        required
        :disabled="isSubmitting"
        :error="errors.nombre"
      />

      <AppInput
        v-model="form.dias_credito"
        type="number"
        label="Días de crédito"
        placeholder="0"
        required
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
import { reactive, ref, watch } from 'vue'
import {
  useCreateCondicionPagoMutation,
  useUpdateCondicionPagoMutation,
} from '@/modules/configuracion/condiciones-pago/composables/useCondicionPagoMutations'
import type {
  CondicionPago,
  CondicionPagoFormMode,
} from '@/modules/configuracion/condiciones-pago/interfaces/condicion-pago.interface'
import { AppInput, AppModal } from '@/shared/components'

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

const form = reactive({
  codigo: '',
  nombre: '',
  dias_credito: '0',
})

const errors = reactive({
  codigo: '',
  nombre: '',
  dias_credito: '',
})

const isSubmitting = ref(false)

const resetForm = () => {
  form.codigo = props.condicionPago?.codigo ?? ''
  form.nombre = props.condicionPago?.nombre ?? ''
  form.dias_credito = String(props.condicionPago?.dias_credito ?? 0)
  errors.codigo = ''
  errors.nombre = ''
  errors.dias_credito = ''
}

const validate = () => {
  errors.codigo = ''
  errors.nombre = ''
  errors.dias_credito = ''

  if (!form.codigo.trim()) {
    errors.codigo = 'El código es obligatorio'
  }

  if (!form.nombre.trim()) {
    errors.nombre = 'El nombre es obligatorio'
  }

  const dias = Number(form.dias_credito)
  if (Number.isNaN(dias) || dias < 0) {
    errors.dias_credito = 'Ingresa un número válido mayor o igual a 0'
  }

  return !errors.codigo && !errors.nombre && !errors.dias_credito
}

const handleClose = () => {
  open.value = false
}

const handleSubmit = async () => {
  if (!validate()) return

  isSubmitting.value = true

  try {
    const payload = {
      codigo: form.codigo.trim(),
      nombre: form.nombre.trim(),
      diasCredito: Number(form.dias_credito),
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
  () => props.condicionPago,
  () => {
    if (open.value) {
      resetForm()
    }
  },
)
</script>
