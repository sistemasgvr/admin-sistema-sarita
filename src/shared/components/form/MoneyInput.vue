<template>
  <div
    @paste="bloquearPegadoMontoInvalido($event, maxDecimals, maxIntegerDigits, permitirNegativos)"
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
import { bloquearPegadoMontoInvalido, bloquearTeclasMontoInvalidas } from '@/shared/utils/currency'
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
    maxIntegerDigits?: number
    permitirNegativos?: boolean
    state?: FormControlState
  }>(),
  {
    state: 'default',
    placeholder: '0.00',
    maxDecimals: 2,
    maxIntegerDigits: 10,
    permitirNegativos: false,
  },
)

const emit = defineEmits<{ blur: []; focus: [] }>()

const model = defineModel<string>({ default: '' })

const {
  id,
  name,
  placeholder,
  disabled,
  readonly,
  required,
  maxDecimals,
  maxIntegerDigits,
  permitirNegativos,
} = props

const controlState = computed<FormControlState>(() =>
  props.state === 'error' ? 'error' : 'default',
)

const inputClasses = useFormControlClasses(controlState, () => ({}))

function onFocus(event: FocusEvent) {
  const input = event.target as HTMLInputElement
  nextTick(() => input.select())
  emit('focus')
}

function onKeydown(event: KeyboardEvent) {
  bloquearTeclasMontoInvalidas(
    event,
    props.maxDecimals,
    props.maxIntegerDigits,
    props.permitirNegativos,
  )
}
</script>
