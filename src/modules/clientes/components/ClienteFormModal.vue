<template>
  <AppModal
    v-model="open"
    :title="mode === 'create' ? 'Nuevo cliente' : 'Editar cliente'"
    :subtitle="
      mode === 'create'
        ? 'Registra un nuevo cliente en el sistema.'
        : 'Actualiza los datos del cliente seleccionado.'
    "
    size="lg"
    @close="handleClose"
  >
    <ClienteForm
      :mode="mode"
      :cliente-id="clienteId"
      :active="open"
      @saved="onSaved"
      @cancel="handleClose"
    />
  </AppModal>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import ClienteForm from '@/modules/clientes/components/ClienteForm.vue'
import type { Cliente, ClienteFormMode } from '@/modules/clientes/interfaces/cliente.interface'
import { AppModal } from '@/shared/components'

const props = defineProps<{
  mode: ClienteFormMode
  cliente?: Cliente | null
}>()

const open = defineModel<boolean>({ default: false })

const emit = defineEmits<{
  saved: [cliente: Cliente]
}>()

const clienteId = computed(() => props.cliente?.id)

const handleClose = () => {
  open.value = false
}

const onSaved = (cliente: Cliente) => {
  emit('saved', cliente)
  open.value = false
}
</script>
