<template>
  <div
    class="rounded-2xl border border-gray-200 bg-white px-4 py-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-5"
  >
    <div class="mb-4 flex flex-wrap items-center gap-x-2 gap-y-2">
      <AppIcon :name="ICONS.listFilter" :size="16" class="text-gray-500 dark:text-gray-400" />
      <h3 class="text-sm font-semibold text-gray-800 dark:text-white/90">
        Filtros generales
      </h3>
      <AppHelpTip
        text="Estos filtros se aplican a todas las vistas del dashboard (Panel principal, Gestión de clientes, Analítica de productos y Control de cilindros)."
      />
      <span
        v-if="tieneFiltros"
        class="ml-auto hidden items-center gap-1.5 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-600 dark:bg-brand-500/10 dark:text-brand-400 sm:inline-flex"
      >
        <span class="size-1.5 rounded-full bg-brand-500 dark:bg-brand-400" />
        Filtros activos
      </span>
      <button
        type="button"
        :disabled="!tieneFiltros"
        class="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:pointer-events-none disabled:opacity-40 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/[0.03]"
        @click="limpiar"
      >
        <AppIcon :name="ICONS.brushCleaning" :size="16" />
        <span class="hidden sm:inline">Limpiar</span>
      </button>
    </div>

    <div
      class="grid grid-cols-1 items-start gap-x-5 gap-y-3 md:grid-cols-[minmax(0,1fr)_minmax(15rem,17rem)]"
    >
      <AppInput
        v-model="filtros.busquedaCliente"
        label="Cliente"
        placeholder="Nombre, DNI o ID interno"
        class="w-full"
      />

      <AppDateRangePicker
        v-model="filtros.periodo"
        label="Periodo"
        placeholder="Desde — hasta"
        class="w-full md:col-start-2 md:row-start-1"
      />

      <div
        class="flex flex-wrap items-center gap-1.5 md:col-span-2"
      >
        <span class="text-xs font-medium text-gray-400 dark:text-gray-500">
          Atajos:
        </span>
        <button
          v-for="preset in PRESETS_PERIODO"
          :key="preset.id"
          type="button"
          class="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-medium text-gray-600 transition hover:border-brand-300 hover:text-brand-600 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:border-brand-500/40 dark:hover:text-brand-400"
          :class="{
            'border-brand-500 bg-brand-600 text-white shadow-sm dark:border-brand-500 dark:bg-brand-600 dark:text-white':
              presetActivo === preset.id,
          }"
          :aria-pressed="presetActivo === preset.id"
          @click="aplicarPreset(preset.id)"
        >
          <AppIcon
            v-if="presetActivo === preset.id"
            :name="ICONS.check"
            :size="12"
          />
          {{ preset.label }}
        </button>
      </div>
    </div>

    <FiltrosActivosBadge removibles class="mt-4" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { AppDateRangePicker, AppHelpTip, AppInput } from '@/shared/components'
import AppIcon from '@/shared/components/AppIcon.vue'
import { ICONS } from '@/shared/constants/icons'
import FiltrosActivosBadge from '@/modules/dashboard/components/FiltrosActivosBadge.vue'
import type { DashboardPresetId } from '@/modules/dashboard/interfaces/dashboard-filtros.interface'
import { useDashboardFiltros } from '@/modules/dashboard/composables/useDashboardFiltros'
import {
  PRESETS_PERIODO,
  rangoPreset,
} from '@/modules/dashboard/utils/dashboard-filtros'

const { filtros, limpiar, tieneFiltros } = useDashboardFiltros()

const presetActivo = computed<DashboardPresetId | null>(() => {
  const { start, end } = filtros.periodo
  if (!start && !end) return null
  for (const preset of PRESETS_PERIODO) {
    const rango = rangoPreset(preset.id)
    if (rango.start === start && rango.end === end) return preset.id
  }
  return null
})

const aplicarPreset = (preset: DashboardPresetId) => {
  filtros.periodo = rangoPreset(preset)
}
</script>