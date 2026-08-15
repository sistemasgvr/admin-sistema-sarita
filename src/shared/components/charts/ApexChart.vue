<template>
  <VueApexCharts
    v-if="hasChart"
    :options="mergedOptions"
    :series="series"
    :type="type"
    :height="height"
    :width="width"
  />
  <div v-else class="py-6 text-center text-sm text-gray-400 dark:text-gray-500">
    Sin datos para mostrar
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import VueApexCharts from 'vue3-apexcharts'
import type { ApexOptions } from 'apexcharts'

export type ApexChartType = NonNullable<ApexOptions['chart']>['type']

const props = withDefaults(
  defineProps<{
    type: ApexChartType
    series: ApexOptions['series']
    options?: ApexOptions
    height?: number | string
    width?: number | string
  }>(),
  {
    options: undefined,
    height: 300,
    width: '100%',
  },
)

const hasChart = computed(() => {
  const series = props.series
  if (Array.isArray(series)) {
    return series.some((item) => {
      if (item && typeof item === 'object' && 'data' in item) {
        return Array.isArray(item.data) && item.data.length > 0
      }
      return item != null
    })
  }
  return series != null
})

const mergedOptions = computed<ApexOptions>(() => ({
  chart: {
    fontFamily: 'inherit',
    toolbar: { show: false },
  },
  dataLabels: { enabled: false },
  ...(props.options ?? {}),
}))
</script>