<template>
  <button
    type="button"
    class="relative flex items-center justify-center text-gray-500 transition-colors bg-white border border-gray-200 rounded-full h-11 w-11 hover:bg-gray-100 hover:text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
    @click.prevent="toggleTheme"
    :aria-label="isDarkMode ? 'Activar modo claro' : 'Activar modo oscuro'"
  >
    <AppIcon v-if="isDarkMode" :name="ICONS.sun" :size="20" />
    <AppIcon v-else :name="ICONS.moon" :size="20" />
  </button>
</template>

<script setup lang="ts">
import AppIcon from '@/shared/components/AppIcon.vue'
import { ICONS } from '@/shared/constants/icons'
import { useTheme } from '@/shared/composables/useTheme'

const { isDarkMode, toggleTheme } = useTheme()
</script>
