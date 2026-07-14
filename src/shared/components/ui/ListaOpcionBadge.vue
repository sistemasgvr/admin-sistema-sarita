<template>
  <AppBadge v-if="label" :size="size" :variant="variant" :color="resolvedColor">
    {{ label }}
  </AppBadge>
  <span v-else class="text-gray-400">—</span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { AppBadge } from '@/shared/components'
import type { BadgeColor, BadgeSize, BadgeVariant } from '@/shared/interfaces/badge.interface'
import { formatListaOpcionLabel } from '@/shared/utils/formatListaOpcion'
import { listaOpcionBadgeColor } from '@/shared/utils/listaOpcionBadge'

const props = withDefaults(
  defineProps<{
    value?: string | null
    descripcion?: string | null
    /** Si true, muestra el código tal cual (p. ej. GARANTIA); si no, etiqueta legible. */
    raw?: boolean
    color?: BadgeColor
    size?: BadgeSize
    variant?: BadgeVariant
  }>(),
  {
    raw: false,
    size: 'sm',
    variant: 'light',
  },
)

const label = computed(() => {
  if (!props.value) return ''
  if (props.raw) return String(props.value)
  return formatListaOpcionLabel(props.value, props.descripcion)
})

const resolvedColor = computed(
  () => props.color ?? listaOpcionBadgeColor(props.value),
)
</script>
