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
      <input
        :id="fieldId"
        type="file"
        :name="name"
        :accept="accept"
        :multiple="multiple"
        :disabled="disabled"
        :required="required"
        :class="fileClasses"
        @change="onChange"
      />
    </template>
  </AppFormField>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import AppFormField from '@/shared/components/form/AppFormField.vue'
import { useFormControlClasses } from '@/shared/composables/useFormControlClasses'
import type { FormControlState } from '@/shared/interfaces/form.interface'

interface AppFileInputProps {
  label?: string
  hint?: string
  error?: string
  name?: string
  id?: string
  accept?: string
  multiple?: boolean
  disabled?: boolean
  required?: boolean
  state?: FormControlState
}

const props = withDefaults(defineProps<AppFileInputProps>(), {
  multiple: false,
  state: 'default',
})

const model = defineModel<File | File[] | null>({ default: null })

const controlState = computed<FormControlState>(() =>
  props.error ? 'error' : props.state,
)

const fileClasses = useFormControlClasses(controlState, () => ({
  file: true,
}))

const onChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  const files = target.files

  if (!files?.length) {
    model.value = null
    return
  }

  model.value = props.multiple ? Array.from(files) : files[0]
}
</script>
