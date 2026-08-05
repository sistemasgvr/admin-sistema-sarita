<template>
  <div class="mb-4 flex flex-wrap items-center gap-2">
    <AppBadge v-for="chip in chips" :key="chip.label" :color="chip.color ?? 'primary'" size="md">
      {{ chip.label }}: {{ chip.value }}
    </AppBadge>
  </div>
</template>

<script setup lang="ts">
import AppBadge from '@/shared/components/ui/AppBadge.vue'
import type { SummaryChip } from '@/shared/interfaces/summary-chip.interface'

defineProps<{
  chips: SummaryChip[]
}>()
</script>
