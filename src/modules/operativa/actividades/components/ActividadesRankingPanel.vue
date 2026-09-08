<template>
  <div
    class="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.02]"
  >
    <div
      class="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-6 py-4 dark:border-gray-800"
    >
      <div class="flex items-center gap-2">
        <div
          class="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-brand-200 bg-brand-50 text-brand-600 dark:border-brand-500/30 dark:bg-brand-500/10 dark:text-brand-400"
        >
          <AppIcon :name="ICONS.trophy" :size="15" />
        </div>
        <h3 class="text-sm font-bold tracking-tight text-gray-800 dark:text-white/90">
          Ranking de colaboradores
        </h3>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <AppInput v-model="fechaDesde" type="date" class="w-40" />
        <AppInput v-model="fechaHasta" type="date" class="w-40" />
      </div>
    </div>

    <div v-if="isLoading" class="px-6 py-8 text-sm text-gray-500">Cargando ranking...</div>

    <div v-else-if="filas.length === 0" class="px-6 py-8 text-center text-sm text-gray-400">
      No hay actividades registradas en este rango.
    </div>

    <div v-else class="overflow-x-auto">
      <table class="min-w-full text-sm">
        <thead
          class="bg-gray-50 text-left text-xs uppercase text-gray-500 dark:bg-white/[0.03] dark:text-gray-400"
        >
          <tr>
            <th class="w-12 px-4 py-2.5 font-medium">#</th>
            <th class="px-4 py-2.5 font-medium">Colaborador</th>
            <th class="px-4 py-2.5 text-right font-medium">Total</th>
            <th class="px-4 py-2.5 text-right font-medium">Realizadas</th>
            <th class="px-4 py-2.5 text-right font-medium">Pendientes</th>
            <th class="px-4 py-2.5 text-right font-medium">Repartos</th>
            <th class="px-4 py-2.5 text-right font-medium">Recojos</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
          <tr v-for="(fila, i) in filas" :key="fila.id_responsable ?? `sin-${i}`">
            <td class="px-4 py-2.5 font-medium text-gray-400 tabular-nums">{{ i + 1 }}</td>
            <td class="px-4 py-2.5 font-medium text-gray-800 dark:text-white/90">
              {{ fila.nombre }}
            </td>
            <td class="px-4 py-2.5 text-right tabular-nums font-semibold">{{ fila.total }}</td>
            <td class="px-4 py-2.5 text-right tabular-nums text-success-600">
              {{ fila.realizadas }}
            </td>
            <td class="px-4 py-2.5 text-right tabular-nums text-gray-500">
              {{ fila.pendientes }}
            </td>
            <td class="px-4 py-2.5 text-right tabular-nums text-gray-500">{{ fila.repartos }}</td>
            <td class="px-4 py-2.5 text-right tabular-nums text-gray-500">{{ fila.recojos }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRankingActividadesQuery } from '@/modules/operativa/actividades/composables/useRankingActividadesQuery'
import type { RankingActividadesFilters } from '@/modules/operativa/actividades/interfaces/actividad.interface'
import { AppInput } from '@/shared/components'
import AppIcon from '@/shared/components/AppIcon.vue'
import { ICONS } from '@/shared/constants/icons'

/** Fecha local en YYYY-MM-DD: en Lima toISOString adelanta un día de noche. */
function isoLocal(fecha: Date) {
  const local = new Date(fecha.getTime() - fecha.getTimezoneOffset() * 60000)
  return local.toISOString().slice(0, 10)
}

const hoy = new Date()
const haceUnMes = new Date(hoy)
haceUnMes.setDate(haceUnMes.getDate() - 30)

const fechaDesde = ref(isoLocal(haceUnMes))
const fechaHasta = ref(isoLocal(hoy))

const filtros = computed<RankingActividadesFilters>(() => ({
  fechaDesde: fechaDesde.value || undefined,
  fechaHasta: fechaHasta.value || undefined,
  limite: 20,
}))

const rankingQuery = useRankingActividadesQuery(filtros)

const isLoading = computed(() => rankingQuery.isFetching.value)
const filas = computed(() => rankingQuery.data.value?.data ?? [])
</script>
