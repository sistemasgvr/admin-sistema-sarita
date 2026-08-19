<template>
  <div
    @keydown="bloquearTeclasMontoInvalidas"
    @paste="bloquearPegadoMontoInvalido"
    @focusout="emit('blur')"
  >
    <input
      :id="id"
      v-model="model"
      type="text"
      inputmode="decimal"
      :name="name"
      :placeholder="placeholder ?? '0.00'"
      :disabled="disabled"
      :readonly="readonly"
      :required="required"
      :class="inputClasses"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useFormControlClasses } from '@/shared/composables/useFormControlClasses'
import {
  bloquearPegadoMontoInvalido,
  bloquearTeclasMontoInvalidas,
} from '@/shared/utils/currency'
import type { FormControlState } from '@/shared/interfaces/form.interface'

const props = withDefaults(
  defineProps<{
    id?: string
    name?: string
    placeholder?: string
    disabled?: boolean
    readonly?: boolean
    required?: boolean
    state?: FormControlState
  }>(),
  { state: 'default', placeholder: '0.00' },
)

const emit = defineEmits<{ blur: [] }>()

const model = defineModel<string>({ default: '' })

const controlState = computed<FormControlState>(() =>
  props.state === 'error' ? 'error' : 'default',
)

const inputClasses = useFormControlClasses(controlState, () => ({}))
</script>
