<template>
  <div
    @paste="bloquearPegadoMontoInvalido($event, maxDecimals, maxIntegerDigits)"
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
      @focus="onFocus"
      @keydown="onKeydown"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick } from 'vue'
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
    maxDecimals?: number
    /**
     * Tope de dígitos enteros que se dejan escribir/pegar. Por defecto 10, el de
     * un `numeric(12,2)`; cada formulario lo ajusta a la columna que guarda el monto.
     */
    maxIntegerDigits?: number
    state?: FormControlState
  }>(),
  { state: 'default', placeholder: '0.00', maxDecimals: 2, maxIntegerDigits: 10 },
)

const emit = defineEmits<{ blur: []; focus: [] }>()

const model = defineModel<string>({ default: '' })

const controlState = computed<FormControlState>(() =>
  props.state === 'error' ? 'error' : 'default',
)

const inputClasses = useFormControlClasses(controlState, () => ({}))

function onFocus(event: FocusEvent) {
  const input = event.target as HTMLInputElement
  // Seleccionar todo para que el siguiente dígito reemplace el valor (p. ej. 0.00 → 5).
  nextTick(() => input.select())
  emit('focus')
}

function onKeydown(event: KeyboardEvent) {
  bloquearTeclasMontoInvalidas(event, props.maxDecimals, props.maxIntegerDigits)
}
</script>
