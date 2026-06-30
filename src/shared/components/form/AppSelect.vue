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
        <select
          :id="fieldId"
          v-model="model"
          :name="name"
          :disabled="disabled"
          :required="required"
          :class="[selectClasses, 'appearance-none bg-none', { 'text-gray-800 dark:text-white': hasValue }]"
        >
          <option v-if="placeholder" value="" disabled>
            {{ placeholder }}
          </option>
          <option
            v-for="option in options"
            :key="String(option.value)"
            :value="option.value"
            :disabled="option.disabled"
            class="text-gray-700 dark:bg-gray-900 dark:text-gray-300"
          >
            {{ option.label }}
          </option>
        </select>

        <span
          class="pointer-events-none absolute right-4 top-1/2 z-10 -translate-y-1/2 text-gray-500 dark:text-gray-400"
        >
          <AppIcon :name="ICONS.chevronDown" :size="20" />
        </span>
      </div>
    </template>
  </AppFormField>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import AppFormField from '@/shared/components/form/AppFormField.vue'
import AppIcon from '@/shared/components/AppIcon.vue'
import { useFormControlClasses } from '@/shared/composables/useFormControlClasses'
import { ICONS } from '@/shared/constants/icons'
import type { FormControlState, SelectOption } from '@/shared/interfaces/form.interface'

interface AppSelectProps {
  label?: string
  hint?: string
  error?: string
  placeholder?: string
  name?: string
  id?: string
  disabled?: boolean
  required?: boolean
  options: SelectOption[]
  state?: FormControlState
}

const props = withDefaults(defineProps<AppSelectProps>(), {
  state: 'default',
})

const model = defineModel<string | number | null>({ default: '' })

const controlState = computed<FormControlState>(() =>
  props.error ? 'error' : props.state,
)

const selectClasses = useFormControlClasses(controlState, () => ({
  hasTrailingIcon: true,
}))

const hasValue = computed(() => model.value !== '' && model.value !== null)
</script>
