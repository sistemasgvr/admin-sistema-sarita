<template>
  <div
    class="flex flex-wrap items-center justify-center gap-1.5 sm:justify-start"
    :class="removibles ? '' : 'rounded-lg bg-gray-100 px-3 py-1.5 dark:bg-white/5'"
  >
    <template v-if="tieneFiltros">
      <span
        v-if="!removibles"
        class="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 dark:text-gray-400"
      >
        <AppIcon :name="ICONS.listFilter" :size="14" />
        Filtros activos
      </span>

      <span
        v-for="chip in chipsActivos"
        :key="chip.id"
        class="inline-flex max-w-full items-center gap-1.5 rounded-full border border-gray-200 bg-white py-1 pl-3 pr-1 text-xs font-medium text-gray-700 shadow-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
      >
        <span class="truncate">{{ chip.label }}</span>
        <button
          type="button"
          aria-label="Quitar filtro"
          class="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-gray-400 transition hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20 dark:hover:text-red-400"
          @click="chip.clear"
        >
          <AppIcon :name="ICONS.x" :size="11" />
        </button>
      </span>

      <button
        v-if="!removibles && tieneFiltros"
        type="button"
        class="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium text-gray-500 transition hover:bg-red-50 hover:text-red-500 dark:text-gray-400 dark:hover:bg-red-900/20 dark:hover:text-red-400"
        @click="limpiarTodos"
      >
        <AppIcon :name="ICONS.brushCleaning" :size="13" />
        Limpiar
      </button>
    </template>

    <span
      v-else-if="!removibles"
      class="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 dark:text-gray-400"
    >
      <AppIcon :name="ICONS.listFilter" :size="14" />
      Sin filtros aplicados
    </span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import AppIcon from '@/shared/components/AppIcon.vue'
import { ICONS } from '@/shared/constants/icons'
import { useDashboardFiltros } from '@/modules/dashboard/composables/useDashboardFiltros'
import { etiquetaPeriodo } from '@/modules/dashboard/utils/dashboard-filtros'

withDefaults(
  defineProps<{
    /** Muestra los filtros como chips removibles (para la tarjeta de filtros). */
    removibles?: boolean
  }>(),
  { removibles: false },
)

const { filtros, limpiar } = useDashboardFiltros()

const chipsActivos = computed<
  { id: string; label: string; clear: () => void }[]
>(() => {
  const chips: { id: string; label: string; clear: () => void }[] = []

  const periodo = etiquetaPeriodo(filtros.periodo)
  if (periodo) {
    chips.push({
      id: 'periodo',
      label: periodo,
      clear: () => {
        filtros.periodo = { start: '', end: '' }
      },
    })
  }

  if (filtros.busquedaCliente.trim()) {
    chips.push({
      id: 'cliente',
      label: `Cliente: ${filtros.busquedaCliente.trim()}`,
      clear: () => {
        filtros.busquedaCliente = ''
      },
    })
  }

  return chips
})

const tieneFiltros = computed(() => chipsActivos.value.length > 0)

const limpiarTodos = () => {
  limpiar()
}
</script>