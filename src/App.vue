<template>
  <ThemeProvider>
    <SidebarProvider>
      <RouterView />
    </SidebarProvider>
  </ThemeProvider>
</template>

<script setup lang="ts">
import { RouterView } from 'vue-router'
import ThemeProvider from '@/shared/layouts/ThemeProvider.vue'
import SidebarProvider from '@/modules/admin/layout/SidebarProvider.vue'
</script>
