<template>
  <div
    class="flex flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white px-6 py-16 text-center dark:border-gray-800 dark:bg-white/[0.03] xl:px-12"
  >
    <div
      class="mb-6 flex h-20 w-20 items-center justify-center rounded-full"
      :class="
        variant === 'not-found'
          ? 'bg-sarita-500/10 text-sarita-500'
          : 'bg-brand-50 text-brand-500 dark:bg-brand-500/10 dark:text-brand-400'
      "
    >
      <span class="text-3xl font-bold">
        <AppIcon
          v-if="variant === 'development'"
          :name="ICONS.construction"
          :size="36"
          class="text-brand-500 dark:text-brand-400"
        />
        <span v-else>404</span>
      </span>
    </div>

    <h3 class="mb-2 text-xl font-semibold text-gray-800 dark:text-white/90 sm:text-2xl">
      {{ title }}
    </h3>

    <p class="mb-8 max-w-md text-sm text-gray-500 dark:text-gray-400 sm:text-base">
      {{ description }}
    </p>

    <router-link
      to="/admin/dashboard"
      class="inline-flex items-center justify-center rounded-lg bg-brand-500 px-5 py-3 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600"
    >
      Volver al dashboard
    </router-link>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import AppIcon from '@/shared/components/AppIcon.vue'
import { ICONS } from '@/shared/constants/icons'

const props = withDefaults(
  defineProps<{
    variant?: 'development' | 'not-found'
    pageTitle?: string
  }>(),
  {
    variant: 'development',
    pageTitle: '',
  },
)

const title = computed(() => {
  if (props.variant === 'not-found') return 'Página no encontrada'
  return props.pageTitle ? `${props.pageTitle} en desarrollo` : 'Página en desarrollo'
})

const description = computed(() => {
  if (props.variant === 'not-found') {
    return 'La ruta que buscas no existe o fue movida. Verifica la URL o regresa al inicio.'
  }
  return 'Este módulo aún está en construcción. Pronto estará disponible en el sistema.'
})
</script>
