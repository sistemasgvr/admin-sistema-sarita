<template>
  <VueApexCharts
    :type="type"
    :height="height"
    :width="width"
    :options="mergedOptions"
    :series="series"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import VueApexCharts from 'vue3-apexcharts'
import type { ApexOptions } from 'apexcharts'
import { useTheme } from '@/shared/composables/useTheme'

type ApexChartType = NonNullable<NonNullable<ApexOptions['chart']>['type']>

const props = withDefaults(
  defineProps<{
    /** Tipo de gráfico ApexCharts: 'bar' | 'line' | 'donut' | 'area' | ... */
    type: ApexChartType
    /** Series de datos (formato según el tipo de gráfico). */
    series: ApexOptions['series'] | number[]
    /** Opciones específicas del gráfico; se combinan sobre los defaults con tema. */
    options?: ApexOptions
    height?: number | string
    width?: number | string
  }>(),
  {
    height: 320,
    width: '100%',
    options: () => ({}),
  },
)

const { isDarkMode } = useTheme()

type Dict = Record<string, unknown>

function isPlainObject(value: unknown): value is Dict {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** Combina en profundidad; los arrays se reemplazan (no se fusionan). */
function mergeDeep<T extends Dict>(base: T, override: Dict): T {
  const result: Dict = { ...base }
  for (const key of Object.keys(override)) {
    const overrideValue = override[key]
    const baseValue = result[key]
    if (isPlainObject(baseValue) && isPlainObject(overrideValue)) {
      result[key] = mergeDeep(baseValue, overrideValue)
    } else {
      result[key] = overrideValue
    }
  }
  return result as T
}

const themeDefaults = computed<ApexOptions>(() => {
  const dark = isDarkMode.value
  const foreColor = dark ? '#98a2b3' : '#667085'

  return {
    chart: {
      fontFamily: 'Outfit, sans-serif',
      background: 'transparent',
      foreColor,
      toolbar: { show: false },
      animations: { speed: 400 },
    },
    theme: { mode: dark ? 'dark' : 'light' },
    grid: {
      borderColor: dark ? '#1f2937' : '#e5e7eb',
      strokeDashArray: 4,
    },
    dataLabels: { enabled: false },
    tooltip: { theme: dark ? 'dark' : 'light' },
    legend: {
      fontFamily: 'Outfit, sans-serif',
      labels: { colors: foreColor },
    },
    stroke: { colors: ['transparent'] },
  }
})

const mergedOptions = computed<ApexOptions>(() =>
  mergeDeep(themeDefaults.value as Dict, (props.options ?? {}) as Dict),
)
</script>
