<template>
  <input
    :id="fieldId"
    type="radio"
    :name="name"
    :value="value"
    :checked="isChecked"
    :disabled="disabled"
    :required="required"
    @change="onChange"
  />
</template>

<script setup lang="ts" generic="T extends string | number">
import { computed, useId } from 'vue'

interface AppRadioProps {
  /** Mismo `name` para agrupar los radios de una misma pregunta. */
  name?: string
  /** Valor que aporta este radio al grupo. */
  value?: T
  /** Valor seleccionado del grupo; se compara por valor, no por referencia. */
  modelValue?: T | null
  disabled?: boolean
  required?: boolean
  id?: string
}

const props = defineProps<AppRadioProps>()
const emit = defineEmits<{ 'update:modelValue': [value: T | null] }>()

const generatedId = useId()
const fieldId = computed(() => props.id ?? generatedId)

const isChecked = computed(() =>
  props.value !== undefined && props.modelValue !== undefined && props.modelValue !== null
    ? String(props.modelValue) === String(props.value)
    : false,
)

const onChange = () => {
  emit('update:modelValue', props.value ?? null)
}
</script>
