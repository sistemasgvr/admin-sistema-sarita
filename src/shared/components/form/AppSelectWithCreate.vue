<template>
  <div class="flex w-full min-w-0 items-start gap-2">
    <div class="min-w-0 flex-1 overflow-hidden">
      <slot />
    </div>

    <div v-if="canCreate" class="flex shrink-0 flex-col">
      <!-- Mismo alto que label (text-sm/leading-5 + mb-1.5) para alinear con el input -->
      <div v-if="hasLabel" class="mb-1.5 h-5 shrink-0" aria-hidden="true" />
      <button
        type="button"
        :aria-label="createTitle"
        :title="createTitle"
        class="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-brand-200 bg-brand-50 text-brand-500 transition hover:border-brand-300 hover:bg-brand-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 dark:border-brand-500/30 dark:bg-brand-500/10 dark:hover:bg-brand-500/20 dark:focus-visible:ring-offset-gray-900"
        :disabled="disabled"
        @click="emit('create')"
      >
        <AppIcon :name="ICONS.plus" :size="18" aria-hidden="true" />
        <span class="sr-only">{{ createTitle }}</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import AppIcon from '@/shared/components/AppIcon.vue'
import { ICONS } from '@/shared/constants/icons'

withDefaults(
  defineProps<{
    canCreate?: boolean
    /** Accessible name for the icon-only create action (WCAG / NN/g). */
    createTitle?: string
    disabled?: boolean
    /**
     * Si el slot muestra label arriba del control, deja espacio para
     * alinear el botón con el input (no con el label).
     */
    hasLabel?: boolean
  }>(),
  {
    canCreate: false,
    createTitle: 'Agregar nuevo',
    disabled: false,
    hasLabel: true,
  },
)

const emit = defineEmits<{
  create: []
}>()
</script>
