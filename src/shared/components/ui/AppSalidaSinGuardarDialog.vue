<template>
  <AppConfirmDialog
    v-model="abierto"
    title="Hay cambios sin guardar"
    message="Si sales ahora, se pierde lo que llenaste en este formulario."
    confirm-label="Salir sin guardar"
    cancel-label="Seguir editando"
    variant="warning"
    @confirm="salir"
    @cancel="quedarse"
  />
</template>

<script setup lang="ts">
import { watch } from 'vue'
import AppConfirmDialog from '@/shared/components/ui/AppConfirmDialog.vue'
import { useDialogoSalidaSinGuardar } from '@/shared/composables/useAvisoCambiosSinGuardar'

const { abierto, salir, quedarse } = useDialogoSalidaSinGuardar()

// Cerrar con Escape o con el fondo equivale a «Seguir editando».
watch(abierto, (valor, anterior) => {
  if (anterior && !valor) quedarse()
})
</script>
