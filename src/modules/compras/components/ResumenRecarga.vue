<template>
  <DetailSectionCard
    v-if="idRecargaPlanta"
    title="Balones movidos (orden de recarga)"
    :icon="ICONS.cylinder"
    :full-width="true"
  >
    <p v-if="numero" class="mb-3 text-xs text-gray-500 dark:text-gray-400">
      Orden de recarga {{ numero }}
    </p>

    <div v-if="balonesQuery.isFetching.value" class="py-4 text-center text-sm text-gray-500 dark:text-gray-400">
      Cargando balones...
    </div>

    <div v-else-if="!balones.length" class="py-4 text-center text-sm text-gray-500 dark:text-gray-400">
      No se encontraron balones para esta orden.
    </div>

    <div v-else class="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800">
      <div class="overflow-x-auto">
        <table class="min-w-full text-sm">
          <thead class="bg-gray-50 dark:bg-white/5">
            <tr>
              <th class="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-300">Balón</th>
              <th class="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-300">Producto</th>
              <th class="px-3 py-2 text-right font-medium text-gray-600 dark:text-gray-300">Capacidad</th>
              <th class="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-300">Estado (Actual)</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="balon in balones"
              :key="balon.id"
              class="border-t border-gray-100 dark:border-gray-800"
            >
              <td class="px-3 py-2 font-medium text-gray-800 dark:text-white/90">
                {{ balon.codigo_balon ?? '—' }}
              </td>
              <td class="px-3 py-2 text-gray-600 dark:text-gray-400">
                {{
                  balon.codigo_producto 
                    ? `${balon.codigo_producto} - ${balon.nombre_producto ?? ''}`
                    : (balon.nombre_producto ?? '—')
                }}
              </td>
              <td class="px-3 py-2 text-right tabular-nums">{{ balon.capacidad ?? '—' }}</td>
              <td class="px-3 py-2 text-gray-600 dark:text-gray-400">
                {{ balon.nombre_estado_balon ?? '—' }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    <p class="mt-2 text-xs text-gray-500 dark:text-gray-400">
      Estos son los cilindros que se movieron con esta compra; la cantidad del detalle puede ser diferente a la capacidad del balón, ya que el contenido se
      maneja como productos.
    </p>
  </DetailSectionCard>
</template>

<script setup lang="ts">
import { computed, toRef } from 'vue'
import { useRecargaPlantaQuery } from '@/modules/balones/recargas/composables/useRecargasPlantaQuery'
import DetailSectionCard from '@/shared/components/detail/DetailSectionCard.vue'
import { ICONS } from '@/shared/constants/icons'

const props = defineProps<{
  idRecargaPlanta: number | null
  /** Etiqueta opcional (ej. número de orden) para mostrar como referencia. */
  numero?: string | null
}>()

const idRecargaPlantaRef = toRef(props, 'idRecargaPlanta')
const balonesQuery = useRecargaPlantaQuery(idRecargaPlantaRef)
const balones = computed(() => balonesQuery.data.value?.detalles ?? [])
</script>
