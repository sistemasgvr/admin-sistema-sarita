<template>
  <div v-if="loading" class="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
    {{ loadingText }}
  </div>

  <div v-else class="space-y-5">
    <div class="flex flex-col gap-5">
      <slot />
    </div>

    <slot name="extra" />
  </div>
</template>

<script setup lang="ts">
import { provide } from 'vue'

withDefaults(
  defineProps<{
    loading?: boolean
    loadingText?: string
  }>(),
  {
    loading: false,
    loadingText: 'Cargando...',
  },
)

provide('detailSectionVariant', 'form')
</script>
