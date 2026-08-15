<template>
  <label
    class="flex items-center gap-3 text-sm"
    :class="disabled ? 'cursor-not-allowed text-gray-400 dark:text-gray-600' : 'cursor-pointer text-gray-700 dark:text-gray-300'"
  >
    <input
      :id="fieldId"
      type="checkbox"
      class="sr-only"
      :checked="model"
      :disabled="disabled"
      :name="name"
      @change="onChange"
    />
    <span
      class="relative h-6 w-11 shrink-0 rounded-full transition"
      :class="model ? 'bg-brand-500' : 'bg-gray-200 dark:bg-gray-700'"
      aria-hidden="true"
    >
      <span
        class="absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform"
        :class="model ? 'translate-x-5' : 'translate-x-0'"
      />
    </span>
    <span v-if="label || help" class="flex min-w-0 items-center gap-1.5 font-medium">
      <span v-if="label">{{ label }}</span>
      <span v-if="help" @click.stop>
        <AppHelpTip :text="help" />
      </span>
    </span>
  </label>
</template>

<script setup lang="ts">
import { computed, useId } from 'vue'
import AppHelpTip from '@/shared/components/ui/AppHelpTip.vue'

const props = defineProps<{
  label?: string
  help?: string
  name?: string
  disabled?: boolean
}>()

const model = defineModel<boolean>({ default: false })

const generatedId = useId()
const fieldId = computed(() => generatedId)

function onChange(event: Event) {
  if (props.disabled) return
  model.value = (event.target as HTMLInputElement).checked
}
</script>
