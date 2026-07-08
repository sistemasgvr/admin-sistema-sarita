<template>
  <label
    class="relative flex cursor-pointer select-none items-center text-sm"
    :class="
      disabled
        ? 'text-gray-300 dark:text-gray-700'
        : 'text-gray-700 dark:text-gray-300'
    "
  >
    <input
      :id="fieldId"
      type="checkbox"
      class="sr-only"
      :name="name"
      :checked="model"
      :disabled="disabled"
      :required="required"
      @change="onChange"
    />
    <span
      class="mr-3 flex h-5 w-5 items-center justify-center rounded-md border-[1.25px] transition-colors"
      :class="
        model
          ? 'border-brand-500 bg-brand-500'
          : disabled
            ? 'border-gray-200 bg-transparent dark:border-gray-800'
            : 'border-gray-300 bg-transparent hover:border-brand-500 dark:border-gray-600 dark:hover:border-brand-500'
      "
    >
      <AppIcon
        v-if="model"
        :name="ICONS.check"
        :size="14"
        class="text-white"
      />
    </span>

    <span v-if="label || $slots.default">
      <slot>{{ label }}</slot>
    </span>
  </label>
</template>

<script setup lang="ts">
import { computed, useId } from 'vue'
import AppIcon from '@/shared/components/AppIcon.vue'
import { ICONS } from '@/shared/constants/icons'

interface AppCheckboxProps {
  label?: string
  name?: string
  id?: string
  disabled?: boolean
  required?: boolean
}

const props = defineProps<AppCheckboxProps>()

const model = defineModel<boolean>({ default: false })

const generatedId = useId()
const fieldId = computed(() => props.id ?? generatedId)

const onChange = (event: Event) => {
  model.value = (event.target as HTMLInputElement).checked
}
</script>