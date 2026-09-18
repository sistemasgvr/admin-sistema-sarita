<template>
  <AppBadge v-if="estado" size="sm" :color="color">{{ etiqueta }}</AppBadge>
  <span v-else class="text-xs text-gray-400">Sin emitir</span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { AppBadge } from '@/shared/components'

const props = defineProps<{ estado?: string | null }>()

const color = computed<'success' | 'error' | 'warning'>(() => {
  if (props.estado === 'ACEPTADO') return 'success'
  if (props.estado === 'RECHAZADO') return 'error'
  return 'warning'
})

const etiqueta = computed(() => {
  switch (props.estado) {
    case 'ACEPTADO': return 'Aceptada'
    case 'RECHAZADO': return 'Rechazada'
    case 'PENDIENTE': return 'En proceso'
    default: return props.estado ?? ''
  }
})
</script>
