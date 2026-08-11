<template>
  <AppInput
    :model-value="value"
    type="number"
    :label="label"
    :name="name"
    :min="minCantidadPorUnidad(nombreUnidad, esGas)"
    :step="stepInputCantidadPorUnidad(nombreUnidad, esGas)"
    :disabled="disabled"
    :error="resolvedError"
    :hint="resolvedHint"
    @update:model-value="onInput"
    @blur="onBlur"
  />
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import { useField } from 'vee-validate'
import * as yup from 'yup'
import {
  cantidadPorUnidadMedidaSchema,
  minCantidadPorUnidad,
  stepInputCantidadPorUnidad,
} from '@/modules/ventas/comprobantes/utils/unidadMedidaCantidad'
import { AppInput } from '@/shared/components'

const props = withDefaults(
  defineProps<{
    name: string
    modelValue: number
    nombreUnidad?: string | null
    esGas?: boolean | null
    label?: string
    hint?: string
    /** Error externo (ej. cantidad > capacidad del cilindro). Tiene prioridad. */
    error?: string
    disabled?: boolean
  }>(),
  {
    label: undefined,
    nombreUnidad: null,
    esGas: null,
    hint: undefined,
    error: undefined,
    disabled: false,
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: number]
}>()

const rules = computed(() =>
  yup.number().test({
    name: 'cantidad-unidad',
    test: async (value, ctx) => {
      try {
        await cantidadPorUnidadMedidaSchema(props.nombreUnidad, props.esGas).validate(value)
        return true
      } catch (err) {
        if (err instanceof yup.ValidationError) {
          return ctx.createError({ message: err.message })
        }
        return ctx.createError({ message: 'Ingresa una cantidad válida' })
      }
    },
  }),
)

const { value, errorMessage, handleBlur, setValue, validate, meta } = useField<number>(
  () => props.name,
  rules,
  {
    initialValue: Number(props.modelValue) || 0,
    validateOnValueUpdate: true,
    /** Independiente del useForm padre: el padre debe llamar validate() al guardar. */
    standalone: true,
  },
)

const resolvedError = computed(() => props.error || errorMessage.value || undefined)
const resolvedHint = computed(() => (props.error ? undefined : props.hint))

watch(
  () => props.modelValue,
  (next) => {
    const n = Number(next)
    if (!Number.isFinite(n) || n === value.value) return
    setValue(n)
    void validate()
  },
)

watch(
  () => [props.nombreUnidad, props.esGas] as const,
  () => {
    void validate()
  },
)

function onInput(raw: string | number | null) {
  const n = raw === '' || raw == null ? 0 : Number(raw)
  const next = Number.isFinite(n) ? n : 0
  setValue(next)
  emit('update:modelValue', next)
  void validate()
}

function onBlur(event: FocusEvent) {
  handleBlur(event)
  void validate()
}

async function validateField() {
  const result = await validate()
  return result
}

defineExpose({
  validate: validateField,
  errorMessage,
  meta,
})
</script>
