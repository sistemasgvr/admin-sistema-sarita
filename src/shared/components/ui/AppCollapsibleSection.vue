<template>
  <section
    class="w-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-theme-xs dark:border-gray-800 dark:bg-gray-900"
  >
    <button
      type="button"
      class="flex w-full items-start gap-3 px-5 py-4 text-left transition hover:bg-gray-50 dark:hover:bg-white/[0.03] sm:px-6"
      :aria-expanded="open"
      @click="open = !open"
    >
      <span
        v-if="icon"
        class="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-500 dark:bg-brand-500/15 dark:text-brand-400"
      >
        <AppIcon :name="icon" :size="16" />
      </span>

      <div class="min-w-0 flex-1">
        <div class="flex flex-wrap items-center gap-2">
          <h3 class="text-sm font-semibold text-gray-800 dark:text-white/90 sm:text-base">
            {{ title }}
          </h3>
          <span
            v-if="badge"
            class="inline-flex rounded-md bg-gray-100 px-2 py-0.5 text-theme-xs font-medium text-gray-600 dark:bg-white/10 dark:text-gray-300"
          >
            {{ badge }}
          </span>
        </div>
        <p v-if="description" class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {{ description }}
        </p>
      </div>

      <AppIcon
        :name="ICONS.chevronDown"
        :size="18"
        class="mt-1 shrink-0 text-gray-400 transition-transform duration-200"
        :class="open ? 'rotate-180' : ''"
      />
    </button>

    <div v-show="open" class="border-t border-gray-200 dark:border-gray-800">
      <div class="space-y-4 px-5 py-5 sm:px-6">
        <slot />
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import AppIcon from '@/shared/components/AppIcon.vue'
import { ICONS, type IconName } from '@/shared/constants/icons'

withDefaults(
  defineProps<{
    title: string
    description?: string
    badge?: string
    icon?: IconName
  }>(),
  {
    description: undefined,
    badge: undefined,
    icon: undefined,
  },
)

const open = defineModel<boolean>('open', { default: false })
</script>
