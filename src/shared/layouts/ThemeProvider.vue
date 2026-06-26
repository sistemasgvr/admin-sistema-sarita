<template>
  <slot></slot>
</template>

<script setup lang="ts">
import { useThemeProvider } from '@/shared/composables/useTheme'

useThemeProvider()
</script>
