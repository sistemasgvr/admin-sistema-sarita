<template>
  <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
    <div class="w-full max-w-[14rem] sm:max-w-xs">
      <AppInput
        v-if="showSearch"
        v-model="search"
        type="search"
        :placeholder="searchPlaceholder"
      />
    </div>

    <div class="flex shrink-0 items-center justify-end gap-2">
      <AppDynamicFilters
        v-if="filterFields?.length"
        v-model="filters"
        :fields="filterFields"
        :preload-all-fields="preloadAllFields"
        @change="emit('filter-change')"
      />

      <slot name="actions" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { AppInput } from '@/shared/components'
import AppDynamicFilters from '@/shared/components/filters/AppDynamicFilters.vue'
import type {
  DynamicFilterFieldDef,
  DynamicFilterValues,
} from '@/shared/interfaces/dynamic-filter.interface'

withDefaults(
  defineProps<{
    filterFields?: DynamicFilterFieldDef[]
    searchPlaceholder?: string
    showSearch?: boolean
    preloadAllFields?: boolean
  }>(),
  {
    searchPlaceholder: 'Buscar...',
    showSearch: true,
    preloadAllFields: true,
  },
)

const search = defineModel<string>('search', { default: '' })
const filters = defineModel<DynamicFilterValues>('filters', { default: () => ({}) })

const emit = defineEmits<{
  'filter-change': []
}>()
</script>
