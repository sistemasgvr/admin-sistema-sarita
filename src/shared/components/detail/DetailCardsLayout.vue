<template>
  <div v-if="loading" class="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
    {{ loadingText }}
  </div>

  <div v-else class="space-y-4">
    <div v-if="$slots.badges" class="flex flex-wrap items-center gap-2">
      <slot name="badges" />
    </div>

    <div class="grid gap-4 sm:grid-cols-2">
      <DetailSectionCard
        v-for="section in sections"
        :key="section.title"
        :title="section.title"
        :icon="section.icon"
        :items="section.items"
        :full-width="section.fullWidth"
      />
    </div>

    <slot name="extra" />
  </div>
</template>

<script setup lang="ts">
import DetailSectionCard from '@/shared/components/detail/DetailSectionCard.vue'
import type { DetailSection } from '@/shared/components/detail/detail.types'

withDefaults(
  defineProps<{
    loading?: boolean
    loadingText?: string
    sections: DetailSection[]
  }>(),
  {
    loading: false,
    loadingText: 'Cargando detalle...',
  },
)
</script>
