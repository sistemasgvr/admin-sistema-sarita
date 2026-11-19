<template>
  <Transition name="conexion-banner">
    <div
      v-if="hayProblema"
      role="alert"
      aria-live="assertive"
      class="fixed inset-x-0 top-0 z-[100000] flex items-center justify-center gap-2 px-4 py-2 text-center text-sm font-medium text-white shadow-md"
      :class="sinInternet ? 'bg-error-600' : 'bg-warning-600'"
    >
      <span aria-hidden="true">●</span>
      <span>{{ mensaje }}</span>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useEstadoConexion } from '@/shared/composables/useEstadoConexion'

const { sinInternet, hayProblema } = useEstadoConexion()

const mensaje = computed(() =>
  sinInternet.value
    ? 'Sin conexión a internet. Los cambios no se están guardando.'
    : 'No hay respuesta del servidor del sistema. Los cambios pueden no estar guardándose.',
)
</script>

<style scoped>
.conexion-banner-enter-active,
.conexion-banner-leave-active {
  transition: transform 0.2s ease, opacity 0.2s ease;
}
.conexion-banner-enter-from,
.conexion-banner-leave-to {
  transform: translateY(-100%);
  opacity: 0;
}
</style>
