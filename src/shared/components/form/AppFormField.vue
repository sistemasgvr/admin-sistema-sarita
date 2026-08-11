<template>
  <div class="w-full">
    <label
      v-if="label"
      :for="fieldId"
      class="mb-1.5 flex items-center gap-1.5 text-sm font-medium"
      :class="
        disabled
          ? 'text-gray-300 dark:text-white/15'
          : 'text-gray-700 dark:text-gray-300'
      "
    >
      <span class="min-w-0">
        {{ label }}
        <span v-if="required" class="text-error-500" aria-hidden="true">*</span>
        <span v-if="required" class="sr-only"> (obligatorio)</span>
        <span
          v-else-if="optional"
          class="ml-1 font-normal text-gray-400 dark:text-gray-500"
        >
          (opcional)
        </span>
      </span>
      <AppHelpTip v-if="help" :text="help" class="-my-0.5" />
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
import AppHelpTip from '@/shared/components/ui/AppHelpTip.vue'

interface AppFormFieldProps {
  label?: string
  /** Texto bajo el campo (evitar para ayudas largas; preferir `help`). */
  hint?: string
  /** Ayuda contextual junto al label (tooltip). */
  help?: string
  error?: string
  required?: boolean
  /** Marks non-required fields explicitly (NN/g: reduce cognitive load). */
  optional?: boolean
  disabled?: boolean
  id?: string
}

const props = defineProps<AppFormFieldProps>()

const generatedId = useId()
const fieldId = computed(() => props.id ?? generatedId)
</script>
