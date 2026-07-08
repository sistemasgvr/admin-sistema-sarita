<template>
  <section
    class="rounded-xl border border-gray-200 bg-white p-4 shadow-theme-xs dark:border-gray-800 dark:bg-gray-900/40"
    :class="fullWidth ? 'sm:col-span-2' : ''"
  >
    <h5 class="mb-3 text-sm font-semibold text-gray-800 dark:text-white/90">
      {{ title }}
    </h5>

    <dl v-if="items?.length" class="grid gap-x-4 gap-y-3 sm:grid-cols-2">
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

    <slot v-else />
  </section>
</template>

<script setup lang="ts">
import type { DetailSectionItem } from '@/modules/balones/components/detail/detail.types'

defineProps<{
  title: string
  items?: DetailSectionItem[]
  fullWidth?: boolean
}>()
</script>
