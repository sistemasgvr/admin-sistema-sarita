<template>
  <div>
    <PageBreadcrumb page-title="Balones" />

    <div class="grid gap-4 sm:grid-cols-1 xl:grid-cols-2">
      <router-link
        v-for="item in visibleItems"
        :key="item.key"
        :to="item.path"
        class="group rounded-xl border border-gray-200 bg-white p-5 shadow-theme-xs transition hover:border-brand-200 hover:shadow-md dark:border-gray-800 dark:bg-gray-900 dark:hover:border-brand-500/30"
      >
        <div
          class="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-lg bg-brand-50 text-brand-500 transition group-hover:bg-brand-100 dark:bg-brand-500/15 dark:group-hover:bg-brand-500/25"
        >
          <AppIcon :name="item.icon" :size="22" />
        </div>

        <h3 class="text-base font-semibold text-gray-800 dark:text-white/90">
          {{ item.title }}
        </h3>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {{ item.description }}
        </p>
      </router-link>
    </div>

    <p
      v-if="!visibleItems.length"
      class="rounded-xl border border-dashed border-gray-200 px-4 py-8 text-center text-sm text-gray-500 dark:border-gray-800 dark:text-gray-400"
    >
      No tienes permisos para acceder a ninguna sección de balones.
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import PageBreadcrumb from '@/modules/admin/components/PageBreadcrumb.vue'
import { balonesHubItems } from '@/modules/balones/config/balones-hub-items'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import AppIcon from '@/shared/components/AppIcon.vue'

const authStore = useAuthStore()

const visibleItems = computed(() =>
  balonesHubItems.filter(
    (item) => item.implemented && authStore.hasPermission(item.permission),
  ),
)
</script>
