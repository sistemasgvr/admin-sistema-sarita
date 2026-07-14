<template>
  <div
    class="grid items-center gap-2 sm:gap-3"
    :class="gridClass"
  >
    <div v-if="showSearch" class="min-w-0 sm:max-w-xs">
      <AppInput
        v-model="search"
        type="search"
        :placeholder="searchPlaceholder"
      />
    </div>

    <div
      v-if="hasTrailingActions"
      class="flex shrink-0 items-center justify-end gap-2"
    >
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
import { computed, useSlots } from 'vue'
import { AppInput } from '@/shared/components'
import AppDynamicFilters from '@/shared/components/filters/AppDynamicFilters.vue'
import type {
  DynamicFilterFieldDef,
  DynamicFilterValues,
} from '@/shared/interfaces/dynamic-filter.interface'

const props = withDefaults(
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

const slots = useSlots()

const search = defineModel<string>('search', { default: '' })
const filters = defineModel<DynamicFilterValues>('filters', { default: () => ({}) })

const emit = defineEmits<{
  'filter-change': []
}>()

const hasTrailingActions = computed(
  () => (props.filterFields?.length ?? 0) > 0 || Boolean(slots.actions),
)

const gridClass = computed(() => {
  if (props.showSearch && hasTrailingActions.value) {
    return 'grid-cols-[minmax(0,1fr)_auto]'
  }

  if (hasTrailingActions.value) {
    return 'grid-cols-1'
  }

  return 'grid-cols-1'
})
</script>
