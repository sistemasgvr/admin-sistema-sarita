<template>
  <div>
    <PageBreadcrumb :page-title="pageTitle" />
    <AdminStatusContent variant="development" :page-title="pageTitle" />
  </div>
</template>

<script setup lang="ts">
import PageBreadcrumb from '@/modules/admin/components/PageBreadcrumb.vue'
import AdminStatusContent from '@/modules/admin/components/AdminStatusContent.vue'

defineProps<{
  pageTitle: string
}>()
</script>
