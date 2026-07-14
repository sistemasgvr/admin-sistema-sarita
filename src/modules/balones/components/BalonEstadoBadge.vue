<template>
  <AppBadge v-if="badge" :size="size" :color="badge.color">{{ badge.label }}</AppBadge>
  <span v-else class="text-gray-400">—</span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { getBalonEstadoBadge } from '@/modules/balones/utils/balonEstadoBadge'
import { AppBadge } from '@/shared/components'
import type { BadgeSize } from '@/shared/interfaces/badge.interface'

const props = withDefaults(
  defineProps<{
    balon: {
      nombre_estado_balon?: string | null
      tiene_solicitud_baja_pendiente?: boolean
    }
    size?: BadgeSize
  }>(),
  { size: 'sm' },
)

const badge = computed(() => getBalonEstadoBadge(props.balon))
</script>
