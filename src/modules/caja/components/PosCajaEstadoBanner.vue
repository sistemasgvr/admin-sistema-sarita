<template>
  <div
    v-if="mensaje"
    class="flex flex-col gap-3 rounded-2xl border px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
    :class="
      cajaCerrada
        ? 'border-warning-200 bg-warning-50 dark:border-warning-500/30 dark:bg-warning-500/10'
        : 'border-amber-200 bg-amber-50 dark:border-amber-500/30 dark:bg-amber-500/10'
    "
  >
    <div class="flex items-start gap-3">
      <span
        class="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
        :class="
          cajaCerrada
            ? 'bg-warning-100 text-warning-700 dark:bg-warning-500/20 dark:text-warning-300'
            : 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300'
        "
      >
        <AppIcon :name="ICONS.alertTriangle" :size="18" />
      </span>
      <div>
        <p
          class="text-sm font-semibold"
          :class="
            cajaCerrada
              ? 'text-warning-800 dark:text-warning-300'
              : 'text-amber-900 dark:text-amber-200'
          "
        >
          {{ cajaCerrada ? 'Caja cerrada' : 'Caja no abierta' }}
        </p>
        <p
          class="mt-0.5 text-theme-sm"
          :class="
            cajaCerrada
              ? 'text-warning-700 dark:text-warning-400'
              : 'text-amber-800 dark:text-amber-300'
          "
        >
          {{ mensaje }}
        </p>
      </div>
    </div>
    <RouterLink
      to="/admin/ventas/caja"
      class="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg bg-brand-500 px-3 py-2 text-sm font-medium text-white hover:bg-brand-600"
    >
      <AppIcon :name="ICONS.cashRegister" :size="16" />
      Ir a Caja
    </RouterLink>
  </div>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router'
import AppIcon from '@/shared/components/AppIcon.vue'
import { ICONS } from '@/shared/constants/icons'

defineProps<{
  mensaje: string | null
  cajaCerrada?: boolean
}>()
</script>
