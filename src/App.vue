<template>
  <ThemeProvider>
    <SidebarProvider>
      <RouterView />
    </SidebarProvider>
    <AppToaster />
    <AppConexionBanner />
    <AppSalidaSinGuardarDialog />
  </ThemeProvider>
</template>

<script setup lang="ts">
import { RouterView } from 'vue-router'
import AppSalidaSinGuardarDialog from '@/shared/components/ui/AppSalidaSinGuardarDialog.vue'
import AppConexionBanner from '@/shared/components/ui/AppConexionBanner.vue'
import SidebarProvider from '@/modules/admin/layout/SidebarProvider.vue'
import ThemeProvider from '@/shared/layouts/ThemeProvider.vue'
import AppToaster from '@/shared/components/ui/AppToaster.vue'
</script>
