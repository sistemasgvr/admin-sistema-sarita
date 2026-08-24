<template>
  <AppFormField
    :label="label"
    :hint="hint"
    :help="help"
    :error="error"
    :required="required"
    :optional="optional"
    :disabled="disabled"
    :id="id"
  >
    <template #default="{ id: fieldId }">
      <div class="relative">
        <input
          :id="fieldId"
          v-model="model"
          :type="inputType"
          :name="name"
          :placeholder="placeholder"
          :disabled="disabled"
          :readonly="readonly"
          :required="required"
          :autocomplete="autocomplete"
          :min="min"
          :max="max"
          :step="step"
          :maxlength="maxlength"
          :inputmode="inputmode"
          :class="inputClasses"
          @input="onInput"
          @blur="emit('blur', $event)"
        />

        <button
          v-if="type === 'password'"
          type="button"
          class="absolute right-4 top-1/2 z-10 -translate-y-1/2 text-gray-500 dark:text-gray-400"
          :aria-label="showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'"
          @click="showPassword = !showPassword"
        >
          <AppIcon :name="showPassword ? ICONS.eyeOff : ICONS.eye" :size="20" />
        </button>
      </div>
    </template>
  </AppFormField>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import AppFormField from '@/shared/components/form/AppFormField.vue'
import AppIcon from '@/shared/components/AppIcon.vue'
import { useFormControlClasses } from '@/shared/composables/useFormControlClasses'
import { ICONS } from '@/shared/constants/icons'
import type { FormControlState, InputType } from '@/shared/interfaces/form.interface'

interface AppInputProps {
  type?: InputType
  label?: string
  hint?: string
  help?: string
  error?: string
  placeholder?: string
  name?: string
  id?: string
  disabled?: boolean
  readonly?: boolean
  required?: boolean
  optional?: boolean
  autocomplete?: string
  min?: string | number
  max?: string | number
  step?: string | number
  maxlength?: string | number
  inputmode?: 'none' | 'text' | 'decimal' | 'numeric' | 'tel' | 'search' | 'email' | 'url'
  state?: FormControlState
  /** Filtra en tiempo real lo que el usuario escribe */
  sanitize?: (value: string) => string
}

const props = withDefaults(defineProps<AppInputProps>(), {
  type: 'text',
  state: 'default',
})

const emit = defineEmits<{
  blur: [event: FocusEvent]
}>()

const model = defineModel<string | number | null>({ default: '' })

const showPassword = ref(false)

function toFiniteNumber(value: string | number | null | undefined): number | null {
  if (value === '' || value == null) return null
  const n = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(n) ? n : null
}

function onInput(event: Event) {
  if ((event as InputEvent).isComposing) return

  const target = event.target as HTMLInputElement
  let next = target.value

  if (props.sanitize && next !== '') {
    next = props.sanitize(next)
  }

  // number + max: limitar en tiempo real (el atributo HTML no bloquea el tecleo)
  if (props.type === 'number' && next !== '') {
    const n = toFiniteNumber(next)
    const maxN = toFiniteNumber(props.max)
    if (n != null && maxN != null && n > maxN) {
      next = String(maxN)
    }
  }

  if (next !== target.value) {
    target.value = next
    model.value = props.type === 'number' && next !== '' ? Number(next) : next
  }
}

const controlState = computed<FormControlState>(() =>
  props.error ? 'error' : props.state,
)

const inputType = computed(() => {
  if (props.type !== 'password') return props.type
  return showPassword.value ? 'text' : 'password'
})

const inputClasses = useFormControlClasses(controlState, () => ({
  hasTrailingIcon: props.type === 'password',
}))
</script>
