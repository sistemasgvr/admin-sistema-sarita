<template>
  <div class="flex flex-wrap gap-1.5">
    <AppBadge
      v-for="(item, index) in items"
      :key="getItemKey(item, index)"
      :color="color"
      :size="size"
      :variant="variant"
    >
      {{ getItemLabel(item) }}
    </AppBadge>

    <span v-if="!items.length" class="text-theme-sm text-gray-400 dark:text-gray-500">
      {{ emptyText }}
    </span>
  </div>
</template>

<script setup lang="ts">
import AppBadge from '@/shared/components/ui/AppBadge.vue'
import type { BadgeColor, BadgeSize, BadgeVariant } from '@/shared/interfaces/badge.interface'

type BadgeListItem = string | number | object

interface AppBadgeListProps {
  items?: BadgeListItem[]
  labelKey?: string
  valueKey?: string
  color?: BadgeColor
  size?: BadgeSize
  variant?: BadgeVariant
  emptyText?: string
}

const props = withDefaults(defineProps<AppBadgeListProps>(), {
  items: () => [],
  labelKey: 'nombre',
  valueKey: 'id',
  color: 'primary',
  size: 'sm',
  variant: 'light',
  emptyText: 'Sin registros',
})

const getRecordValue = (item: BadgeListItem, key: string) => {
  if (typeof item !== 'object' || item === null) {
    return undefined
  }

  return Reflect.get(item, key)
}

const getItemLabel = (item: BadgeListItem) => {
  if (typeof item === 'string' || typeof item === 'number') {
    return String(item)
  }

  const label = getRecordValue(item, props.labelKey)
  return label === undefined || label === null ? '—' : String(label)
}

const getItemKey = (item: BadgeListItem, index: number) => {
  if (typeof item === 'object' && item !== null) {
    const key = getRecordValue(item, props.valueKey)
    if (key !== undefined && key !== null) {
      return String(key)
    }
  }

  return `${getItemLabel(item)}-${index}`
}
</script>
