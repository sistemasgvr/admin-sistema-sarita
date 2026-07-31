<template>
  <AppInput
    :model-value="value"
    type="number"
    :label="label"
    :name="name"
    :min="minCantidadPorUnidad(nombreUnidad)"
    :step="stepInputCantidadPorUnidad(nombreUnidad)"
    :disabled="disabled"
    :error="errorMessage || undefined"
    :hint="hint"
    @update:model-value="onInput"
    @blur="onBlur"
  />
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import { toTypedSchema } from '@vee-validate/yup'
import { useField } from 'vee-validate'
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
    label?: string
    hint?: string
    disabled?: boolean
  }>(),
  {
    label: undefined,
    nombreUnidad: null,
    hint: undefined,
    disabled: false,
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: number]
}>()

const validationSchema = computed(() =>
  toTypedSchema(cantidadPorUnidadMedidaSchema(props.nombreUnidad)),
)

const { value, errorMessage, handleBlur, setValue, validate } = useField<number>(
  () => props.name,
  validationSchema,
  {
    initialValue: Number(props.modelValue) || 0,
    validateOnValueUpdate: true,
  },
)

watch(
  () => props.modelValue,
  (next) => {
    const n = Number(next)
    if (Number.isFinite(n) && n !== value.value) {
      setValue(n, false)
    }
  },
)

watch(
  () => props.nombreUnidad,
  () => {
    void validate()
  },
)

function onInput(raw: string | number | null) {
  const n = raw === '' || raw == null ? 0 : Number(raw)
  setValue(Number.isFinite(n) ? n : 0)
  emit('update:modelValue', Number.isFinite(n) ? n : 0)
}

function onBlur(event: FocusEvent) {
  handleBlur(event)
  void validate()
}

defineExpose({
  validate,
  errorMessage,
})
</script>
