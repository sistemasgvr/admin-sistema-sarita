<template>
  <div
    class="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2.5 dark:border-gray-800 dark:bg-white/[0.03]"
  >
    <div class="flex flex-wrap items-start justify-between gap-2">
      <div class="min-w-0">
        <p class="text-sm font-medium text-gray-800 dark:text-white/90">
          <RouterLink
            v-if="balon?.id"
            :to="{ name: 'admin-balones-cilindros-detalle', params: { id: String(balon.id) } }"
            class="hover:text-brand-600 dark:hover:text-brand-400"
          >
            {{ codigo }}
          </RouterLink>
          <span v-else>{{ codigo }}</span>
          <span
            v-if="balon?.numero_serie && balon.numero_serie !== balon.codigo_balon"
            class="font-normal text-gray-500 dark:text-gray-400"
          >
            · Serie {{ balon.numero_serie }}
          </span>
          <span
            v-if="balon?.nombre_tipo_balon"
            class="font-normal text-gray-500 dark:text-gray-400"
          >
            · {{ balon.nombre_tipo_balon }}
          </span>
        </p>
        <p class="mt-0.5 text-theme-xs text-gray-500 dark:text-gray-400">
          <template v-if="lineaTecnica">{{ lineaTecnica }}</template>
          <template v-if="lineaUbicacion">
            <span v-if="lineaTecnica"> · </span>{{ lineaUbicacion }}
          </template>
          <span v-if="!lineaTecnica && !lineaUbicacion">Sin ficha cargada</span>
        </p>
        <p
          v-if="usaSnapshot"
          class="mt-0.5 text-theme-xs text-gray-400 dark:text-gray-500"
        >
          Estado y ubicación al momento del movimiento
        </p>
      </div>
      <div class="flex flex-wrap items-center gap-1.5">
        <ListaOpcionBadge v-if="tipoMovimiento" :value="tipoMovimiento" />
        <BalonEstadoBadge v-if="fichaParaBadges" :balon="fichaParaBadges" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Balon } from '@/modules/balones/cilindros/interfaces/balon.interface'
import BalonEstadoBadge from '@/modules/balones/components/BalonEstadoBadge.vue'
import { ListaOpcionBadge } from '@/shared/components'
import { formatListaOpcionLabel } from '@/shared/utils/formatListaOpcion'

export interface BalonFichaSnapshot {
  nombre_estado_balon?: string | null
  nombre_almacen_ubicacion?: string | null
  nombre_cliente_ubicacion?: string | null
}

const props = defineProps<{
  balon?: Balon | null
  codigoFallback?: string | null
  tipoMovimiento?: string | null
  /** Custodia histórica (detalle/edición de un movimiento). */
  snapshot?: BalonFichaSnapshot | null
}>()

const codigo = computed(
  () => props.balon?.codigo_balon || props.codigoFallback || 'Cilindro',
)

const usaSnapshot = computed(() => props.snapshot != null)

const fichaParaBadges = computed(() => {
  const snap = props.snapshot
  if (snap) {
    return {
      nombre_estado_balon: snap.nombre_estado_balon,
      tiene_solicitud_baja_pendiente: false,
    }
  }
  return props.balon ?? null
})

const lineaTecnica = computed(() => {
  const balon = props.balon
  if (!balon) return ''
  const parts: string[] = []
  if (balon.nombre_producto_gas) parts.push(balon.nombre_producto_gas)
  if (balon.capacidad != null) {
    parts.push(
      balon.nombre_unidad_medida
        ? `${balon.capacidad} ${balon.nombre_unidad_medida}`
        : String(balon.capacidad),
    )
  }
  if (balon.nombre_marca_cilindro) {
    parts.push(formatListaOpcionLabel(balon.nombre_marca_cilindro))
  }
  if (balon.tipo_valvula?.trim()) {
    parts.push(balon.tipo_valvula.trim())
  }
  if (balon.peso_aproximado_kg != null) {
    parts.push(`${Number(balon.peso_aproximado_kg)} kg`)
  }
  if (balon.sello_inspeccion?.trim()) {
    parts.push(`Sello ${balon.sello_inspeccion.trim()}`)
  }
  return parts.join(' · ')
})

const lineaUbicacion = computed(() => {
  const snap = props.snapshot
  if (snap) {
    const parts: string[] = []
    const propietario = formatListaOpcionLabel(props.balon?.nombre_propietario)
    if (propietario) {
      if (props.balon?.nombre_cliente_propietario) {
        parts.push(`${propietario} · ${props.balon.nombre_cliente_propietario}`)
      } else if (props.balon?.nombre_planta) {
        parts.push(`${propietario} · ${props.balon.nombre_planta}`)
      } else {
        parts.push(propietario)
      }
    }
    if (snap.nombre_almacen_ubicacion) parts.push(snap.nombre_almacen_ubicacion)
    else if (snap.nombre_cliente_ubicacion) parts.push(snap.nombre_cliente_ubicacion)
    return parts.join(' · ')
  }

  const balon = props.balon
  if (!balon) return ''
  const parts: string[] = []
  const propietario = formatListaOpcionLabel(balon.nombre_propietario)
  if (propietario) {
    if (balon.nombre_cliente_propietario) {
      parts.push(`${propietario} · ${balon.nombre_cliente_propietario}`)
    } else if (balon.nombre_planta) {
      parts.push(`${propietario} · ${balon.nombre_planta}`)
    } else {
      parts.push(propietario)
    }
  }
  if (balon.nombre_almacen) parts.push(balon.nombre_almacen)
  else if (balon.nombre_cliente_ubicacion) parts.push(balon.nombre_cliente_ubicacion)
  return parts.join(' · ')
})
</script>
