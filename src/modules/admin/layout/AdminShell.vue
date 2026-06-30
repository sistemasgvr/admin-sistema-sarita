<template>
  <AdminLayout>
    <RouterView />
  </AdminLayout>
</template>

<script setup lang="ts">
import { RouterView } from 'vue-router'
import { useAuthMeQuery } from '@/modules/auth/composables/useAuthMeQuery'
import AdminLayout from './AdminLayout.vue'

useAuthMeQuery()
</script>
