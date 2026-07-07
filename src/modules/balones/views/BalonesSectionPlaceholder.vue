<template>
  <div>
    <PageBreadcrumb :page-title="pageTitle" :items="breadcrumbItems" />

    <div
      class="rounded-xl border border-dashed border-gray-200 bg-white px-6 py-12 text-center shadow-theme-xs dark:border-gray-800 dark:bg-gray-900"
    >
      <div
        class="mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full bg-brand-50 text-brand-500 dark:bg-brand-500/15"
      >
        <AppIcon :name="ICONS.construction" :size="28" />
      </div>
      <h3 class="text-lg font-semibold text-gray-800 dark:text-white/90">
        {{ pageTitle }}
      </h3>
      <p class="mx-auto mt-2 max-w-md text-sm text-gray-500 dark:text-gray-400">
        Esta sección se habilitará en la <strong>Fase {{ phase }}</strong> del módulo de balones.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import PageBreadcrumb from '@/modules/admin/components/PageBreadcrumb.vue'
import { balonesBreadcrumbItems } from '@/modules/balones/config/balones-breadcrumb'
import AppIcon from '@/shared/components/AppIcon.vue'
import { ICONS } from '@/shared/constants/icons'

const props = defineProps<{
  pageTitle: string
  phase: number
}>()

const breadcrumbItems = computed(() => balonesBreadcrumbItems(props.pageTitle))
</script>
