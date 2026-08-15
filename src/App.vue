<template>
  <ThemeProvider>
    <SidebarProvider>
      <RouterView />
    </SidebarProvider>
    <AppToaster />
  </ThemeProvider>
</template>

<script setup lang="ts">
import { RouterView } from 'vue-router'
import SidebarProvider from '@/modules/admin/layout/SidebarProvider.vue'
import ThemeProvider from '@/shared/layouts/ThemeProvider.vue'
import AppToaster from '@/shared/components/ui/AppToaster.vue'
</script>
