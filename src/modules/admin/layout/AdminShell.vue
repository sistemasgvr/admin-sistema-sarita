<template>
  <AdminLayout>
    <RouterView />
  </AdminLayout>
</template>

<script setup lang="ts">
import { RouterView } from 'vue-router'
import AdminLayout from './AdminLayout.vue'
</script>
