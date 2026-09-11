<template>
  <AppCollapsibleSection
    v-model:open="isOpen"
    :title="title"
    :badge="`${tutorials.length}`"
    :icon="icon"
  >
    <div class="space-y-2">
      <button
        v-for="tutorial in tutorials"
        :key="tutorial.id"
        type="button"
        class="w-full rounded-xl border p-3 text-left transition"
        :class="
          tutorial.id === selectedId
            ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300'
            : 'border-gray-200 hover:border-brand-300 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-white/[0.03]'
        "
        @click="emit('select', tutorial.id)"
      >
        <span class="block text-sm font-semibold">{{ tutorial.title }}</span>
        <span class="mt-1 block text-xs text-gray-500 dark:text-gray-400">
          {{ tutorial.description }}
        </span>
      </button>
    </div>
  </AppCollapsibleSection>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { AppCollapsibleSection } from '@/shared/components'
import type { IconName } from '@/shared/constants/icons'

export interface TutorialMenuItem {
  id: string
  title: string
  description: string
}

defineProps<{
  title: string
  tutorials: readonly TutorialMenuItem[]
  selectedId: string
  icon?: IconName
}>()

const emit = defineEmits<{
  select: [id: string]
}>()

const isOpen = ref(true)
</script>
