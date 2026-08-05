<template>
  <div
    class="mb-4 grid gap-3"
    :class="gridClass"
  >
    <div
      v-for="card in cards"
      :key="card.key ?? card.label"
      class="rounded-xl border border-gray-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-gray-900"
    >
      <div class="flex items-start justify-between gap-2">
        <p class="text-theme-xs text-gray-500 dark:text-gray-400">
          {{ card.label }}
        </p>
        <span
          v-if="card.icon"
          class="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
          :class="card.iconClass || defaultIconClass"
        >
          <AppIcon :name="card.icon" :size="15" />
        </span>
      </div>
      <p class="mt-1 text-lg font-semibold text-gray-800 dark:text-white/90">
        {{ card.value }}
      </p>
      <p
        v-if="card.hint"
        class="mt-0.5 text-[11px] text-gray-400 dark:text-gray-500"
      >
        {{ card.hint }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import AppIcon from '@/shared/components/AppIcon.vue'
import type { IconName } from '@/shared/constants/icons'

export interface SummaryCardItem {
  key?: string
  label: string
  value: string | number
  hint?: string
  icon?: IconName
  iconClass?: string
}

const props = withDefaults(
  defineProps<{
    cards: SummaryCardItem[]
    columns?: 2 | 3 | 4 | 5
  }>(),
  {
    columns: 4,
  },
)

const defaultIconClass =
  'bg-brand-100 text-brand-600 dark:bg-brand-500/20 dark:text-brand-300'

const gridClass = computed(() => {
  switch (props.columns) {
    case 2:
      return 'sm:grid-cols-2'
    case 3:
      return 'sm:grid-cols-2 xl:grid-cols-3'
    case 5:
      return 'sm:grid-cols-2 xl:grid-cols-5'
    case 4:
    default:
      return 'sm:grid-cols-2 xl:grid-cols-4'
  }
})
</script>
