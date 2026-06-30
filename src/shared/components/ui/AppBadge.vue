<template>
  <span :class="[baseStyles, sizeClass, colorStyles]">
    <AppIcon v-if="icon" :name="icon" :size="iconSize" />
    <slot />
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import AppIcon from '@/shared/components/AppIcon.vue'
import type { IconName } from '@/shared/constants/icons'
import type { BadgeColor, BadgeSize, BadgeVariant } from '@/shared/interfaces/badge.interface'

interface AppBadgeProps {
  variant?: BadgeVariant
  size?: BadgeSize
  color?: BadgeColor
  icon?: IconName
}

const props = withDefaults(defineProps<AppBadgeProps>(), {
  variant: 'light',
  color: 'primary',
  size: 'sm',
})

const baseStyles =
  'inline-flex items-center justify-center gap-1 rounded-full font-medium whitespace-nowrap'

const sizeStyles: Record<BadgeSize, string> = {
  sm: 'px-2.5 py-0.5 text-theme-xs',
  md: 'px-3 py-1 text-theme-sm',
}

const variants: Record<BadgeVariant, Record<BadgeColor, string>> = {
  light: {
    primary: 'bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400',
    success: 'bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-500',
    error: 'bg-error-500/10 text-error-600 dark:bg-error-500/15 dark:text-error-500',
    warning: 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',
    neutral: 'bg-gray-100 text-gray-700 dark:bg-white/5 dark:text-gray-300',
    dark: 'bg-gray-700 text-white dark:bg-white/10 dark:text-white',
  },
  solid: {
    primary: 'bg-brand-500 text-white',
    success: 'bg-success-500 text-white',
    error: 'bg-error-500 text-white',
    warning: 'bg-amber-500 text-white',
    neutral: 'bg-gray-500 text-white',
    dark: 'bg-gray-800 text-white dark:bg-gray-700',
  },
}

const sizeClass = computed(() => sizeStyles[props.size])
const colorStyles = computed(() => variants[props.variant][props.color])
const iconSize = computed(() => (props.size === 'sm' ? 12 : 14))
</script>
