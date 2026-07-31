<template>
  <AppModal
    v-model="open"
    :title="mode === 'create' ? 'Nuevo préstamo' : 'Editar préstamo'"
    :subtitle="
      mode === 'create'
        ? 'Registra la cabecera del préstamo. Luego podrás agregar cilindros.'
        : 'Actualiza los datos del préstamo y gestiona los cilindros incluidos.'
    "
    size="xl"
    @close="handleClose"
  >
    <PrestamoForm
      :mode="mode"
      :prestamo-id="prestamoId"
      :active="open"
      @cancel="handleClose"
      @saved="onSaved"
      @created="onCreated"
    />
  </AppModal>
</template>

<script setup lang="ts">
import PrestamoForm, {
  type PrestamoFormSavedPayload,
} from '@/modules/balones/prestamos/components/PrestamoForm.vue'
import type { PrestamoFormMode } from '@/modules/balones/prestamos/interfaces/prestamo.interface'
import { AppModal } from '@/shared/components'

interface PrestamoFormModalProps {
  mode: PrestamoFormMode
  prestamoId?: number | null
}

withDefaults(defineProps<PrestamoFormModalProps>(), {
  prestamoId: null,
})

const open = defineModel<boolean>({ default: false })

const emit = defineEmits<{
  saved: [payload?: PrestamoFormSavedPayload]
}>()

const handleClose = () => {
  open.value = false
}

const onSaved = (payload?: PrestamoFormSavedPayload) => {
  emit('saved', payload)
}

const onCreated = (payload: PrestamoFormSavedPayload) => {
  emit('saved', payload)
}
</script>
