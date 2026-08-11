<template>
  <AppModal
    v-model="open"
    :title="mode === 'create' ? 'Nueva condición de pago' : 'Editar condición de pago'"
    :subtitle="
      mode === 'create'
        ? 'Define contado, crédito simple o plan de cuotas.'
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

      <AppSelect
        v-model="modalidad"
        label="Modalidad"
        required
        :options="modalidadOptions"
        :disabled="isSubmitting"
      />

      <AppInput
        v-if="modalidad !== 'CONTADO'"
        v-model="dias_credito"
        type="number"
        :label="
          modalidad === 'CUOTAS'
            ? 'Días hasta la 1ª cuota'
            : 'Días de crédito'
        "
        :placeholder="modalidad === 'CUOTAS' ? '0 = próximo día de cobro' : '10'"
        :required="modalidad === 'CREDITO'"
        v-bind="diasCreditoAttrs"
        :disabled="isSubmitting"
        :error="errors.dias_credito"
        :hint="
          modalidad === 'CUOTAS'
            ? 'Opcional. Si es 0, la 1ª cuota cae en el próximo día de cobro del mes.'
            : 'Días desde la venta hasta el vencimiento único.'
        "
      />

      <div v-if="modalidad === 'CUOTAS'" class="grid gap-4 sm:grid-cols-2">
        <AppInput
          v-model="numero_cuotas"
          type="number"
          label="Cantidad de cuotas"
          placeholder="3"
          required
          v-bind="numeroCuotasAttrs"
          :disabled="isSubmitting"
          :error="errors.numero_cuotas"
          hint="Se reparte el total en N cuotas mensuales."
        />
        <AppInput
          v-model="dia_mes_pago"
          type="number"
          label="Día del mes a cobrar"
          placeholder="15"
          required
          v-bind="diaMesPagoAttrs"
          :disabled="isSubmitting"
          :error="errors.dia_mes_pago"
          hint="Ej.: 15 = cada día 15. Si el mes no tiene ese día, usa el último."
        />
      </div>

      <p
        class="rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-600 dark:bg-white/5 dark:text-gray-400"
      >
        {{ ayudaModalidad }}
      </p>
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
import { computed, ref, watch } from 'vue'
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
  CondicionPagoModalidad,
} from '@/modules/configuracion/condiciones-pago/interfaces/condicion-pago.interface'
import { AppInput, AppModal, AppSelect } from '@/shared/components'
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

const modalidad = ref<CondicionPagoModalidad>('CONTADO')

const modalidadOptions = [
  { value: 'CONTADO', label: 'Contado (pago al momento)' },
  { value: 'CREDITO', label: 'Crédito simple (un vencimiento)' },
  { value: 'CUOTAS', label: 'Cuotas mensuales' },
]

const ayudaModalidad = computed(() => {
  if (modalidad.value === 'CONTADO') {
    return 'No genera cuenta por cobrar. En el POS se exige medio de pago.'
  }
  if (modalidad.value === 'CREDITO') {
    return 'Genera una sola cuenta por cobrar que vence a los N días de la venta.'
  }
  return 'Genera un plan de CxC con N cuotas. Cada cuota vence el día del mes indicado.'
})

function resolverModalidad(c?: CondicionPago | null): CondicionPagoModalidad {
  if (!c) return 'CONTADO'
  if (c.modalidad === 'CUOTAS' || Number(c.numero_cuotas) > 1) return 'CUOTAS'
  if (c.modalidad === 'CREDITO' || Number(c.dias_credito) > 0) return 'CREDITO'
  return 'CONTADO'
}

const { defineField, handleSubmit, resetForm, errors, isSubmitting } = useForm({
  validationSchema: computed(() =>
    toTypedSchema(
      yup.object({
        codigo: requiredString('El código'),
        nombre: requiredString('El nombre'),
        dias_credito:
          modalidad.value === 'CREDITO'
            ? yup
                .number()
                .typeError('Los días de crédito son obligatorios')
                .required('Los días de crédito son obligatorios')
                .integer()
                .min(1, 'En crédito simple debe ser al menos 1 día')
            : nonNegativeNumber(),
        numero_cuotas:
          modalidad.value === 'CUOTAS'
            ? yup
                .number()
                .typeError('La cantidad de cuotas es obligatoria')
                .required('La cantidad de cuotas es obligatoria')
                .min(2, 'Mínimo 2 cuotas')
                .integer()
            : yup.number().nullable().optional(),
        dia_mes_pago:
          modalidad.value === 'CUOTAS'
            ? yup
                .number()
                .typeError('El día del mes es obligatorio')
                .required('El día del mes es obligatorio')
                .min(1, 'Mínimo día 1')
                .max(31, 'Máximo día 31')
                .integer()
            : yup.number().nullable().optional(),
      }),
    ),
  ),
  initialValues: {
    codigo: '',
    nombre: '',
    dias_credito: 0,
    numero_cuotas: 3 as number | undefined,
    dia_mes_pago: 15 as number | undefined,
  },
})

const [codigo, codigoAttrs] = defineField('codigo')
const [nombre, nombreAttrs] = defineField('nombre')
const [dias_credito, diasCreditoAttrs] = defineField('dias_credito')
const [numero_cuotas, numeroCuotasAttrs] = defineField('numero_cuotas')
const [dia_mes_pago, diaMesPagoAttrs] = defineField('dia_mes_pago')

const syncFormValues = () => {
  const c = props.condicionPago
  modalidad.value = resolverModalidad(c)
  resetForm({
    values: {
      codigo: c?.codigo ?? '',
      nombre: c?.nombre ?? '',
      dias_credito: c?.dias_credito ?? (modalidad.value === 'CREDITO' ? 10 : 0),
      numero_cuotas: c?.numero_cuotas ?? 3,
      dia_mes_pago: c?.dia_mes_pago ?? 15,
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
      diasCredito:
        modalidad.value === 'CONTADO' ? 0 : Number(values.dias_credito || 0),
      numeroCuotas:
        modalidad.value === 'CUOTAS' ? Number(values.numero_cuotas) : null,
      diaMesPago:
        modalidad.value === 'CUOTAS' ? Number(values.dia_mes_pago) : null,
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

watch(modalidad, (value) => {
  if (value === 'CONTADO') {
    dias_credito.value = 0
  } else if (value === 'CREDITO' && !(Number(dias_credito.value) > 0)) {
    dias_credito.value = 10
  } else if (value === 'CUOTAS') {
    if (!(Number(numero_cuotas.value) >= 2)) numero_cuotas.value = 3
    if (!(Number(dia_mes_pago.value) >= 1)) dia_mes_pago.value = 15
  }
})

</script>
