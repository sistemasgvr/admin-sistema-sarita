<template>
  <div v-if="loading" class="flex items-center justify-center gap-2 py-8 text-sm text-gray-500 dark:text-gray-400">
    <AppIcon :name="ICONS.loader" :size="16" class="animate-spin" />
    Cargando...
  </div>

  <div
    v-else-if="error"
    class="flex flex-col items-center justify-center gap-2 py-8 text-center"
  >
    <AppIcon :name="ICONS.alertCircle" :size="20" class="text-error-500" />
    <p class="text-sm text-gray-500 dark:text-gray-400">No se pudo cargar la información.</p>
    <button
      type="button"
      class="text-theme-xs font-medium text-brand-500 hover:text-brand-600"
      @click="emit('retry')"
    >
      Reintentar
    </button>
  </div>

  <div
    v-else-if="empty"
    class="flex flex-col items-center justify-center gap-2 py-8 text-center"
  >
    <AppIcon :name="ICONS.inbox" :size="20" class="text-gray-400" />
    <p class="text-sm text-gray-500 dark:text-gray-400">{{ emptyText }}</p>
  </div>

  <slot v-else />
</template>

<script setup lang="ts">
import AppIcon from '@/shared/components/AppIcon.vue'
import { ICONS } from '@/shared/constants/icons'

interface RelatedListStateProps {
  loading?: boolean
  error?: boolean
  empty?: boolean
  emptyText?: string
}

withDefaults(defineProps<RelatedListStateProps>(), {
  loading: false,
  error: false,
  empty: false,
  emptyText: 'No hay registros para mostrar.',
})

const emit = defineEmits<{
  retry: []
}>()
</script>
