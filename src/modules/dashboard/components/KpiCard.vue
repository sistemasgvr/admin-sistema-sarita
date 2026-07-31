<template>
  <component
    :is="clickable ? 'button' : 'div'"
    :type="clickable ? 'button' : undefined"
    class="w-full rounded-2xl border border-gray-200 bg-white p-5 text-left dark:border-gray-800 dark:bg-white/[0.03]"
    :class="
      clickable
        ? 'cursor-pointer transition hover:border-brand-300 hover:shadow-theme-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 dark:hover:border-brand-500/50'
        : ''
    "
    @click="clickable && emit('click')"
  >
    <div class="flex items-start justify-between gap-4">
      <div class="min-w-0">
        <p class="text-sm text-gray-500 dark:text-gray-400">{{ label }}</p>
        <p
          v-if="!loading"
          class="mt-2 text-2xl font-semibold text-gray-800 dark:text-white/90"
        >
          {{ value }}
        </p>
        <div
          v-else
          class="mt-3 h-7 w-24 animate-pulse rounded-md bg-gray-200 dark:bg-gray-700"
        />
        <p v-if="hint && !loading" class="mt-1 text-xs text-gray-400 dark:text-gray-500">
          {{ hint }}
        </p>
      </div>

      <span
        class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
        :class="toneClasses"
      >
        <AppIcon :name="icon" :size="22" />
      </span>
    </div>
    <p
      v-if="clickable && !loading"
      class="mt-3 inline-flex items-center gap-1 text-xs font-medium text-brand-500 dark:text-brand-400"
    >
      Ver detalle
      <AppIcon :name="ICONS.chevronRight" :size="14" />
    </p>
  </component>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import AppIcon from '@/shared/components/AppIcon.vue'
import { ICONS, type IconName } from '@/shared/constants/icons'

type KpiTone = 'blue' | 'amber' | 'rose' | 'emerald' | 'indigo'

const props = withDefaults(
  defineProps<{
    label: string
    value: string | number
    icon: IconName
    tone?: KpiTone
    hint?: string
    loading?: boolean
    clickable?: boolean
  }>(),
  {
    tone: 'blue',
    loading: false,
    clickable: false,
  },
)

const emit = defineEmits<{ click: [] }>()

const toneMap: Record<KpiTone, string> = {
  blue: 'bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400',
  amber: 'bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400',
  rose: 'bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400',
  emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400',
  indigo: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-400',
}

const toneClasses = computed(() => toneMap[props.tone])
</script>
