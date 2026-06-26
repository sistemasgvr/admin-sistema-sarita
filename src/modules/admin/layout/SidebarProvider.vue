<template>
  <slot></slot>
</template>

<script setup lang="ts">
import { useSidebarProvider } from '@/modules/admin/composables/useSidebar'

useSidebarProvider()
</script>
