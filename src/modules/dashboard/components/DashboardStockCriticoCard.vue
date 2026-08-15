<template>
  <div class="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
    <div class="mb-4 flex items-center justify-between gap-2">
      <div class="flex items-center gap-2">
        <AppIcon :name="ICONS.alertTriangle" :size="18" class="text-error-500" />
        <h3 class="text-base font-semibold text-gray-800 dark:text-white/90">
          Stock crítico de accesorios
        </h3>
      </div>
      <RouterLink
        :to="{ name: 'admin-productos-stock' }"
        class="shrink-0 text-theme-xs font-medium text-brand-600 hover:underline dark:text-brand-400"
      >
        Ver stock
      </RouterLink>
    </div>

    <div v-if="loading" class="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
      Cargando…
    </div>

    <div
      v-else-if="!registros.length"
      class="py-8 text-center text-sm text-gray-500 dark:text-gray-400"
    >
      Sin productos bajo el stock mínimo.
    </div>

    <ul v-else class="divide-y divide-gray-100 dark:divide-gray-800">
      <li
        v-for="item in registros"
        :key="item.id"
        class="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
      >
        <div class="min-w-0">
          <p class="truncate text-theme-sm font-medium text-gray-700 dark:text-gray-200">
            {{ item.nombre_producto }}
          </p>
          <p class="text-theme-xs text-error-500">
            Quedan: {{ formatNumber(item.stock) }} {{ item.nombre_unidad_medida || 'unid.' }}
          </p>
        </div>
        <AppBadge color="error" variant="light" size="sm" class="shrink-0">
          Bajo mínimo
        </AppBadge>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router'
import AppIcon from '@/shared/components/AppIcon.vue'
import { AppBadge } from '@/shared/components'
import { ICONS } from '@/shared/constants/icons'
import type { Stock } from '@/modules/productos/stock/interfaces/stock.interface'
import { formatNumber } from '@/shared/utils/currency'

withDefaults(
  defineProps<{
    registros: Stock[]
    loading?: boolean
  }>(),
  {
    loading: false,
  },
)
</script>
