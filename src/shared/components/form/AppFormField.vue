<template>
  <div class="w-full">
    <label
      v-if="label"
      :for="fieldId"
      class="mb-1.5 block text-sm font-medium"
      :class="
        disabled
          ? 'text-gray-300 dark:text-white/15'
          : 'text-gray-700 dark:text-gray-300'
      "
    >
      {{ label }}
      <span v-if="required" class="text-error-500">*</span>
    </label>

    <slot :id="fieldId" />

    <p v-if="error" class="mt-1.5 text-theme-xs text-error-500">
      {{ error }}
    </p>
    <p v-else-if="hint" class="mt-1.5 text-theme-xs text-gray-500 dark:text-gray-400">
      {{ hint }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed, useId } from 'vue'

interface AppFormFieldProps {
  label?: string
  hint?: string
  error?: string
  required?: boolean
  disabled?: boolean
  id?: string
}

const props = defineProps<AppFormFieldProps>()

const generatedId = useId()
const fieldId = computed(() => props.id ?? generatedId)
</script>
