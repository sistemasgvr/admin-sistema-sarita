<template>
  <div class="flex flex-col items-start gap-1">
    <ListaOpcionBadge :value="String(estadoSunat ?? 'PENDIENTE')" />
    <AppBadge v-if="plazo" size="sm" :color="plazo.color">
      {{ plazo.label }}
    </AppBadge>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { evaluarPlazoEmisionGre } from '@/modules/ventas/guias-remision/utils/plazoEmisionGre'
import { AppBadge, ListaOpcionBadge } from '@/shared/components'

const props = defineProps<{
  estadoSunat?: string | null
  fechaTraslado?: string | null
  ticketSunat?: string | null
}>()

const plazo = computed(() =>
  evaluarPlazoEmisionGre({
    fechaTraslado: props.fechaTraslado,
    estadoSunat: props.estadoSunat,
    ticketSunat: props.ticketSunat,
  }),
)
</script>
