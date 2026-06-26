<template>
  <Icon :icon="name" :width="size" :height="size" aria-hidden="true" />
</template>

<script setup lang="ts">
import { Icon } from '@iconify/vue'

withDefaults(
  defineProps<{
    /** Nombre del icono en formato Iconify, ej: `lucide:settings` */
    name: string
    size?: number | string
  }>(),
  {
    size: 24,
  },
)
</script>
