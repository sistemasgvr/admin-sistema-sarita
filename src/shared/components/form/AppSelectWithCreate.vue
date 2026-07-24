<template>
  <div class="flex w-full min-w-0 items-end gap-2">
    <div class="min-w-0 flex-1 overflow-hidden">
      <slot />
    </div>

    <button
      v-if="canCreate"
      type="button"
      :title="createTitle"
      class="mb-0 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-brand-200 bg-brand-50 text-brand-500 transition hover:border-brand-300 hover:bg-brand-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-brand-500/30 dark:bg-brand-500/10 dark:hover:bg-brand-500/20"
      :disabled="disabled"
      @click="emit('create')"
    >
      <AppIcon :name="ICONS.plus" :size="18" />
    </button>
  </div>
</template>

<script setup lang="ts">
import AppIcon from '@/shared/components/AppIcon.vue'
import { ICONS } from '@/shared/constants/icons'

withDefaults(
  defineProps<{
    canCreate?: boolean
    createTitle?: string
    disabled?: boolean
  }>(),
  {
    canCreate: false,
    createTitle: 'Agregar nuevo',
    disabled: false,
  },
)

const emit = defineEmits<{
  create: []
}>()
</script>
