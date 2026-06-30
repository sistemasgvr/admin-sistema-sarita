<template>
  <AppFormField
    :label="label"
    :hint="hint"
    :error="error"
    :required="required"
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
          :class="inputClasses"
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
  error?: string
  placeholder?: string
  name?: string
  id?: string
  disabled?: boolean
  readonly?: boolean
  required?: boolean
  autocomplete?: string
  min?: string | number
  max?: string | number
  step?: string | number
  state?: FormControlState
}

const props = withDefaults(defineProps<AppInputProps>(), {
  type: 'text',
  state: 'default',
})

const model = defineModel<string | number | null>({ default: '' })

const showPassword = ref(false)

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
