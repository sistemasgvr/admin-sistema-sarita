<template>
  <div class="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
    <div class="mb-4 flex items-center gap-2">
      <AppIcon :name="ICONS.handCoins" :size="18" class="text-gray-500 dark:text-gray-400" />
      <h3 class="text-base font-semibold text-gray-800 dark:text-white/90">{{ titulo }}</h3>
    </div>

    <div v-if="loading" class="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
      Cargando…
    </div>

    <div
      v-else-if="!clientesLimitados.length"
      class="py-8 text-center text-sm text-gray-500 dark:text-gray-400"
    >
      Sin clientes con deuda pendiente.
    </div>

    <ul v-else class="space-y-4">
      <li v-for="cliente in clientesLimitados" :key="cliente.idCliente">
        <div class="mb-1.5 flex items-center justify-between gap-3">
          <p class="truncate text-theme-sm font-medium text-gray-700 dark:text-gray-200">
            {{ cliente.razonSocial || cliente.nombres || 'Cliente sin nombre' }}
          </p>
          <p class="shrink-0 text-theme-sm font-semibold text-gray-800 dark:text-white/90">
            {{ formatCurrency(cliente.montoTotalDeuda) }}
          </p>
        </div>
        <div class="h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-white/10">
          <div
            class="h-full rounded-full bg-brand-500 dark:bg-brand-400"
            :style="{ width: `${porcentaje(cliente.montoTotalDeuda)}%` }"
          />
        </div>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import AppIcon from '@/shared/components/AppIcon.vue'
import { ICONS } from '@/shared/constants/icons'
import type { DashboardClienteConDeuda } from '@/modules/dashboard/interfaces/dashboard.interface'
import { formatCurrency } from '@/shared/utils/currency'

const props = withDefaults(
  defineProps<{
    clientes: DashboardClienteConDeuda[]
    loading?: boolean
    limite?: number
    titulo?: string
  }>(),
  {
    loading: false,
    limite: 5,
    titulo: 'Top clientes con mayor deuda',
  },
)

const clientesLimitados = computed(() => props.clientes.slice(0, props.limite))

const montoMaximo = computed(() =>
  clientesLimitados.value.reduce((max, c) => Math.max(max, c.montoTotalDeuda), 0),
)

const porcentaje = (monto: number) => {
  if (montoMaximo.value <= 0) return 0
  return Math.max(4, Math.round((monto / montoMaximo.value) * 100))
}
</script>
