<template>
  <AppModal v-model="open" title="Comentarios de la caja" size="md">
    <p v-if="query.isLoading.value" class="text-theme-sm text-gray-500 dark:text-gray-400">
      Cargando...
    </p>
    <p v-else-if="query.isError.value" class="text-theme-sm text-error-600 dark:text-error-400">
      No se pudo cargar la bitácora.
    </p>
    <CajaBitacoraEventos v-else :eventos="query.data.value?.eventos ?? []" />
  </AppModal>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { AppModal } from '@/shared/components'
import CajaBitacoraEventos from '@/modules/caja/components/CajaBitacoraEventos.vue'
import { useCajaSesionQuery } from '@/modules/caja/composables/useCajaQuery'

const open = defineModel<boolean>({ default: false })
const props = defineProps<{ idSesion: number | null }>()

const query = useCajaSesionQuery(computed(() => (open.value ? props.idSesion : null)))
</script>
