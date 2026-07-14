<template>
  <span class="inline-flex flex-wrap items-center gap-1">
    <AppBadge size="sm" color="primary" class="tabular-nums">
      {{ formatListDate(from) }}
    </AppBadge>
    <span class="text-xs text-gray-400">/</span>
    <AppBadge size="sm" color="neutral" class="tabular-nums">
      {{ formatListDate(to) }}
    </AppBadge>
  </span>
</template>

<script setup lang="ts">
import { AppBadge } from '@/shared/components'
import { formatListDate } from '@/shared/utils/date'

defineProps<{
  from?: string | null
  to?: string | null
}>()
</script>
