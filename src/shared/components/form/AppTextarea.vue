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
      <textarea
        :id="fieldId"
        v-model="model"
        :name="name"
        :placeholder="placeholder"
        :disabled="disabled"
        :readonly="readonly"
        :required="required"
        :rows="rows"
        :class="textareaClasses"
      />
    </template>
  </AppFormField>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import AppFormField from '@/shared/components/form/AppFormField.vue'
import { useFormControlClasses } from '@/shared/composables/useFormControlClasses'
import type { FormControlState } from '@/shared/interfaces/form.interface'

interface AppTextareaProps {
  label?: string
  hint?: string
  error?: string
  placeholder?: string
  name?: string
  id?: string
  disabled?: boolean
  readonly?: boolean
  required?: boolean
  rows?: number
  state?: FormControlState
}

const props = withDefaults(defineProps<AppTextareaProps>(), {
  rows: 4,
  state: 'default',
})

const model = defineModel<string>({ default: '' })

const controlState = computed<FormControlState>(() =>
  props.error ? 'error' : props.state,
)

const textareaClasses = useFormControlClasses(controlState, () => ({
  textarea: true,
}))
</script>
