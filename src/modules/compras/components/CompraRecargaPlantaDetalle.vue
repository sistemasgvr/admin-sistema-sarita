<template>
  <div v-if="loading" class="py-3 text-sm text-gray-500 dark:text-gray-400">
    Cargando detalle de la orden...
  </div>

  <div v-else-if="!recarga" class="py-3 text-sm text-gray-500 dark:text-gray-400">
    No se encontró la orden de recarga.
  </div>

  <div v-else class="space-y-3">
    <div class="flex flex-wrap items-center gap-1.5">
      <AppBadge v-if="recarga.numero" size="sm" color="primary" variant="light">
        {{ recarga.numero }}
      </AppBadge>
      <AppBadge v-if="recarga.nombre_estado" size="sm" :color="estadoColor" variant="light">
        {{ etiquetaEstado }}
      </AppBadge>
      <AppBadge v-if="recarga.nombre_proveedor" size="sm" color="neutral" variant="light">
        {{ recarga.nombre_proveedor }}
      </AppBadge>
      <AppBadge v-if="recarga.nombre_almacen" size="sm" color="neutral" variant="light">
        {{ recarga.nombre_almacen }}
      </AppBadge>
    </div>

    <dl class="grid gap-2 text-xs sm:grid-cols-3">
      <div class="rounded-lg border border-gray-200 px-3 py-2 dark:border-gray-800">
        <dt class="text-gray-500 dark:text-gray-400">Fecha salida</dt>
        <dd class="mt-0.5 font-medium text-gray-800 dark:text-white/90">
          {{ formatListDate(recarga.fecha_salida) || '—' }}
        </dd>
      </div>
      <div class="rounded-lg border border-gray-200 px-3 py-2 dark:border-gray-800">
        <dt class="text-gray-500 dark:text-gray-400">Cilindros</dt>
        <dd class="mt-0.5 font-medium text-gray-800 dark:text-white/90">
          {{ balones.length }}
        </dd>
      </div>
      <div class="rounded-lg border border-gray-200 px-3 py-2 dark:border-gray-800">
        <dt class="text-gray-500 dark:text-gray-400">Capacidad total</dt>
        <dd class="mt-0.5 font-medium tabular-nums text-gray-800 dark:text-white/90">
          {{ capacidadTotalLabel }}
        </dd>
      </div>
    </dl>

    <p v-if="recarga.observacion" class="text-xs text-gray-500 dark:text-gray-400">
      Obs.: {{ recarga.observacion }}
    </p>

    <div v-if="balones.length" class="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800">
      <div class="overflow-x-auto">
        <table class="min-w-full text-sm">
          <thead class="bg-gray-50 dark:bg-white/5">
            <tr>
              <th class="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-300">Cilindro</th>
              <th class="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-300">
                Gas que carga
              </th>
              <th class="px-3 py-2 text-right font-medium text-gray-600 dark:text-gray-300">
                Capacidad
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="balon in balones"
              :key="balon.id ?? balon.id_balon"
              class="border-t border-gray-100 dark:border-gray-800"
            >
              <td class="px-3 py-2 font-medium text-gray-800 dark:text-white/90">
                {{ balon.codigo_balon ?? '—' }}
                <p
                  v-if="balon.nombre_tipo_balon"
                  class="mt-0.5 text-xs font-normal text-gray-400"
                >
                  {{ balon.nombre_tipo_balon }}
                </p>
              </td>
              <td class="px-3 py-2 text-gray-600 dark:text-gray-400">
                <p>{{ etiquetaProductoGas(balon) }}</p>
                <p v-if="balon.observacion" class="mt-0.5 text-xs text-gray-400">
                  {{ balon.observacion }}
                </p>
              </td>
              <td class="px-3 py-2 text-right tabular-nums text-gray-800 dark:text-white/90">
                {{ formatCapacidad(balon) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <p v-if="showHint" class="text-xs text-gray-500 dark:text-gray-400">
      {{ hint }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type {
  RecargaPlanta,
  RecargaPlantaDetalle,
} from '@/modules/balones/recargas/interfaces/recarga-planta.interface'
import { AppBadge } from '@/shared/components'
import { formatListDate } from '@/shared/utils/date'

const props = withDefaults(
  defineProps<{
    recarga: RecargaPlanta | null | undefined
    loading?: boolean
    showHint?: boolean
    hint?: string
  }>(),
  {
    loading: false,
    showHint: true,
    hint:
      'La capacidad es la referencia de lo que puede volver cargado. Lo que realmente ingresa de cada gas se indica en el detalle de productos y entra al stock con el retorno.',
  },
)

const balones = computed(() => props.recarga?.detalles ?? [])

/** Suma de capacidades por unidad (los cilindros de una orden suelen compartirla). */
const capacidadTotalLabel = computed(() => {
  const porUnidad = new Map<string, number>()
  for (const balon of balones.value) {
    const cap = Number(balon.capacidad_balon ?? balon.capacidad)
    if (!Number.isFinite(cap) || cap <= 0) continue
    const um =
      balon.unidad_capacidad_balon?.trim() || balon.nombre_unidad_medida?.trim() || ''
    porUnidad.set(um, (porUnidad.get(um) ?? 0) + cap)
  }
  if (porUnidad.size === 0) return '—'
  return [...porUnidad.entries()]
    .map(([um, total]) => {
      const texto = total.toLocaleString('es-PE', { maximumFractionDigits: 2 })
      return um ? `${texto} ${um}` : texto
    })
    .join(' · ')
})

const estadoColor = computed(() => {
  const e = (props.recarga?.nombre_estado ?? '').toUpperCase()
  if (e === 'ANULADA') return 'error'
  if (e === 'CERRADO') return 'success'
  if (e === 'RETORNADO') return 'primary'
  if (e === 'ENVIADO') return 'warning'
  return 'neutral'
})

// CERRADO es el estado derivado "tiene compra vinculada": no cierra nada (la
// compra se puede anular y la orden vuelve a quedar facturable), así que se
// muestra como lo que es.
const etiquetaEstado = computed(() => {
  const e = props.recarga?.nombre_estado ?? ''
  const map: Record<string, string> = {
    BORRADOR: 'Borrador',
    ENVIADO: 'En planta',
    RETORNADO: 'Retornada',
    CERRADO: 'Facturada',
    ANULADA: 'Anulada',
  }
  return map[e] ?? e
})

function etiquetaProductoGas(balon: RecargaPlantaDetalle) {
  const nombre =
    balon.nombre_producto_gas_balon?.trim() ||
    balon.nombre_producto?.trim() ||
    null
  if (!nombre) {
    if (balon.id_producto_gas_balon != null) return `Gas #${balon.id_producto_gas_balon}`
    if (balon.id_producto != null) return `Producto #${balon.id_producto}`
    return '—'
  }
  if (balon.codigo_producto) return `${balon.codigo_producto} — ${nombre}`
  return nombre
}

function formatCapacidad(balon: RecargaPlantaDetalle) {
  const cap = balon.capacidad_balon ?? balon.capacidad
  if (cap == null || !Number.isFinite(Number(cap))) return '—'
  const um =
    balon.unidad_capacidad_balon?.trim() ||
    balon.nombre_unidad_medida?.trim() ||
    ''
  return um ? `${cap} ${um}` : String(cap)
}
</script>
