<template>
  <Toaster
    :theme="theme"
    position="top-right"
    rich-colors
    close-button
    close-button-position="top-right"
    :duration="4500"
    :gap="14"
    :offset="16"
    :visible-toasts="4"
    class="app-toaster"
  >
    <template #success-icon>
      <AppIcon :name="ICONS.check" :size="18" />
    </template>
    <template #error-icon>
      <AppIcon :name="ICONS.alertCircle" :size="18" />
    </template>
    <template #warning-icon>
      <AppIcon :name="ICONS.alertTriangle" :size="18" />
    </template>
    <template #info-icon>
      <AppIcon :name="ICONS.circleHelp" :size="18" />
    </template>
  </Toaster>
</template>

<script setup lang="ts">
import { Toaster } from 'vue-sonner'
import AppIcon from '@/shared/components/AppIcon.vue'
import { useTheme } from '@/shared/composables/useTheme'
import { ICONS } from '@/shared/constants/icons'

const { theme } = useTheme()
</script>
