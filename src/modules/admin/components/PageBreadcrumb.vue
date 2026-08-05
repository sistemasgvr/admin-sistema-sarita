<template>
  <div class="flex flex-wrap items-center justify-between gap-3 mb-6">
    <div class="flex items-center gap-2">
      <h2 class="text-xl font-semibold text-gray-800 dark:text-white/90">
        {{ pageTitle }}
      </h2>
      <AppHelpTip v-if="help" :text="help" />
    </div>
    <nav>
      <ol class="flex items-center gap-1.5">
        <template v-for="(item, index) in resolvedItems" :key="`${item.label}-${index}`">
          <li v-if="item.to">
            <router-link
              class="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400"
              :to="item.to"
            >
              {{ item.label }}
              <span class="text-gray-400 dark:text-gray-500" aria-hidden="true">/</span>
            </router-link>
          </li>
          <li v-else class="text-sm text-gray-800 dark:text-white/90">
            {{ item.label }}
          </li>
        </template>
      </ol>
    </nav>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { AppHelpTip } from '@/shared/components'
import type { BreadcrumbItem } from '@/shared/interfaces/breadcrumb.interface'

const props = defineProps<{
  pageTitle: string
  items?: BreadcrumbItem[]
  /** Texto del tooltip de ayuda junto al título */
  help?: string
}>()

const resolvedItems = computed(() => {
  if (props.items?.length) {
    return props.items
  }

  return [
    { label: 'Inicio', to: '/admin/dashboard' },
    { label: props.pageTitle },
  ]
})
</script>
