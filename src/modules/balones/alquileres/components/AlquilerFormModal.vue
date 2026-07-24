<template>
  <AppModal
    v-model="open"
    :title="mode === 'create' ? 'Nuevo alquiler' : 'Editar alquiler'"
    :subtitle="
      mode === 'create'
        ? 'Registra la cabecera del alquiler. Luego podrás agregar cilindros.'
        : 'Actualiza los datos del alquiler y gestiona los cilindros incluidos.'
    "
    size="xl"
    @close="handleClose"
  >
    <AlquilerForm
      :mode="mode"
      :alquiler-id="alquilerId"
      :active="open"
      @cancel="handleClose"
      @saved="onSaved"
      @created="onCreated"
    />
  </AppModal>
</template>

<script setup lang="ts">
import AlquilerForm, {
  type AlquilerFormSavedPayload,
} from '@/modules/balones/alquileres/components/AlquilerForm.vue'
import type { AlquilerFormMode } from '@/modules/balones/alquileres/interfaces/alquiler.interface'
import { AppModal } from '@/shared/components'

interface AlquilerFormModalProps {
  mode: AlquilerFormMode
  alquilerId?: number | null
}

withDefaults(defineProps<AlquilerFormModalProps>(), {
  alquilerId: null,
})

const open = defineModel<boolean>({ default: false })

const emit = defineEmits<{
  saved: []
}>()

const handleClose = () => {
  open.value = false
}

const onSaved = (_payload?: AlquilerFormSavedPayload) => {
  emit('saved')
}

const onCreated = (_payload: AlquilerFormSavedPayload) => {
  emit('saved')
}
</script>
