<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <AppSidebar />
    <Backdrop />
    <div
      class="min-w-0 transition-all duration-300 ease-in-out"
      :class="[isExpanded || isHovered ? 'lg:ml-[290px]' : 'lg:ml-[90px]']"
    >
      <AppHeader />
      <div class="mx-auto min-w-0 max-w-(--breakpoint-2xl) p-4 md:p-6">
        <slot></slot>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import AppSidebar from './AppSidebar.vue'
import AppHeader from './AppHeader.vue'
import Backdrop from './Backdrop.vue'
import { useSidebar } from '@/modules/admin/composables/useSidebar'

const { isExpanded, isHovered } = useSidebar()
</script>
