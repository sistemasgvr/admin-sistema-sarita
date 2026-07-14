<template>
  <section
    class="rounded-xl border border-gray-200 bg-white shadow-theme-xs dark:border-gray-800 dark:bg-gray-900/40"
    :class="[
      isFormVariant ? 'p-5' : 'p-4',
      fullWidth ? 'sm:col-span-2' : '',
    ]"
  >
    <div
      class="flex items-start justify-between gap-3"
      :class="isFormVariant ? 'mb-5' : 'mb-3'"
    >
      <div class="flex min-w-0 items-center gap-2.5">
        <span
          v-if="icon"
          class="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-500 dark:bg-brand-500/15 dark:text-brand-400"
        >
          <AppIcon :name="icon" :size="16" />
        </span>
        <h5 class="text-sm font-semibold text-gray-800 dark:text-white/90">
          {{ title }}
        </h5>
      </div>

      <div v-if="$slots.actions" class="shrink-0">
        <slot name="actions" />
      </div>
    </div>

    <dl v-if="items?.length" class="grid gap-x-5 gap-y-4 sm:grid-cols-2">
      <div
        v-for="item in items"
        :key="item.label"
        :class="item.fullWidth ? 'sm:col-span-2' : ''"
      >
        <dt class="text-theme-xs text-gray-500 dark:text-gray-400">{{ item.label }}</dt>
        <dd class="text-sm font-medium text-gray-800 dark:text-white/90">
          {{ item.value ?? '—' }}
        </dd>
      </div>
    </dl>

    <div
      v-else
      :class="isFormVariant ? 'space-y-5 [&_.grid]:gap-5' : ''"
    >
      <slot />
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, inject } from 'vue'
import AppIcon from '@/shared/components/AppIcon.vue'
import type { IconName } from '@/shared/constants/icons'
import type { DetailSectionItem } from '@/shared/components/detail/detail.types'

defineProps<{
  title: string
  icon?: IconName
  items?: DetailSectionItem[]
  fullWidth?: boolean
}>()

const sectionVariant = inject<'form' | 'default'>('detailSectionVariant', 'default')
const isFormVariant = computed(() => sectionVariant === 'form')
</script>
