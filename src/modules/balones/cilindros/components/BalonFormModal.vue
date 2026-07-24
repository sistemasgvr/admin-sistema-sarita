<template>
  <AppModal
    v-model="open"
    :title="mode === 'create' ? 'Nuevo cilindro' : 'Editar cilindro'"
    :subtitle="
      mode === 'create'
        ? 'Registra un cilindro en el libro de trazabilidad.'
        : 'Actualiza los datos del cilindro seleccionado.'
    "
    size="xl"
    @close="handleClose"
  >
    <BalonForm
      :mode="mode"
      :balon-id="balonId"
      :preset="preset"
      :active="open"
      @cancel="handleClose"
      @saved="onSaved"
      @created="onCreated"
    />
  </AppModal>
</template>

<script setup lang="ts">
import BalonForm from '@/modules/balones/cilindros/components/BalonForm.vue'
import type {
  Balon,
  BalonFormMode,
  BalonFormPreset,
} from '@/modules/balones/cilindros/interfaces/balon.interface'
import { AppModal } from '@/shared/components'

interface BalonFormModalProps {
  mode: BalonFormMode
  balonId?: number | null
  preset?: BalonFormPreset | null
}

withDefaults(defineProps<BalonFormModalProps>(), {
  preset: null,
  balonId: null,
})

const open = defineModel<boolean>({ default: false })

const emit = defineEmits<{
  saved: []
  created: [balon: Balon]
}>()

const handleClose = () => {
  open.value = false
}

const onSaved = () => {
  emit('saved')
  open.value = false
}

const onCreated = (balon: Balon) => {
  emit('created', balon)
}
</script>
