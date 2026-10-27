<template>
  <ul
    v-if="eventos.length"
    class="max-h-72 divide-y divide-gray-100 overflow-y-auto dark:divide-gray-800"
  >
    <li
      v-for="e in eventos"
      :key="e.id"
      class="space-y-1 py-2.5 text-theme-sm first:pt-0 last:pb-0"
    >
      <div class="flex flex-wrap items-center justify-between gap-2">
        <div class="flex items-center gap-2">
          <AppBadge :color="colorTipo(e.tipo)" size="sm">{{ etiquetaTipo(e.tipo) }}</AppBadge>
          <span v-if="e.usuario" class="text-gray-600 dark:text-gray-300">{{ e.usuario }}</span>
        </div>
        <span class="text-theme-xs text-gray-400">{{ formatDateTime(e.fechaHora) }}</span>
      </div>
      <p v-if="e.monto != null" class="tabular-nums text-gray-700 dark:text-gray-200">
        {{ e.tipo === 'CERRAR' ? 'Contado' : 'Inicial' }} {{ formatCurrency(e.monto) }}
        <span
          v-if="e.diferencia != null"
          class="ml-2"
          :class="Number(e.diferencia) !== 0 ? 'font-medium text-error-600 dark:text-error-400' : 'text-gray-400'"
        >
          Dif. {{ formatCurrency(e.diferencia) }}
        </span>
      </p>
      <p v-if="e.observacion" class="text-gray-500 dark:text-gray-400">{{ e.observacion }}</p>
    </li>
  </ul>
  <p v-else class="text-theme-sm text-gray-500 dark:text-gray-400">Sin comentarios</p>
</template>

<script setup lang="ts">
import { AppBadge } from '@/shared/components'
import type { CajaSesionEvento } from '@/modules/caja/interfaces/caja.interface'
import { formatCurrency } from '@/shared/utils/currency'
import { formatDateTime } from '@/shared/utils/date'

defineProps<{ eventos: CajaSesionEvento[] }>()

const ETIQUETAS: Record<CajaSesionEvento['tipo'], string> = {
  ABRIR: 'Apertura',
  CERRAR: 'Cierre',
  REABRIR: 'Reapertura',
}

function etiquetaTipo(tipo: CajaSesionEvento['tipo']) {
  return ETIQUETAS[tipo] ?? tipo
}

function colorTipo(tipo: CajaSesionEvento['tipo']) {
  return tipo === 'CERRAR' ? 'warning' : tipo === 'REABRIR' ? 'primary' : 'success'
}
</script>
