<template>
  <AppBadge v-if="badge" :size="size" :color="badge.color">{{ badge.label }}</AppBadge>
  <span v-else class="text-gray-400">—</span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { AppBadge } from '@/shared/components'
import type { BadgeColor, BadgeSize } from '@/shared/interfaces/badge.interface'
import { normalizeListaOpcionCode } from '@/shared/utils/listaOpcionBadge'

const props = withDefaults(
  defineProps<{
    balon: {
      nombre_estado_contenido?: string | null
    }
    size?: BadgeSize
  }>(),
  { size: 'sm' },
)

const CONTENIDO_BADGE: Record<string, { label: string; color: BadgeColor }> = {
  LLENO: { label: 'Lleno', color: 'success' },
  VACIO: { label: 'Vacío', color: 'neutral' },
  DESCONOCIDO: { label: 'Desconocido', color: 'warning' },
}

const badge = computed(() => {
  const code = normalizeListaOpcionCode(props.balon.nombre_estado_contenido)
  if (!code) return null
  return CONTENIDO_BADGE[code] ?? { label: code, color: 'neutral' as BadgeColor }
})
</script>
