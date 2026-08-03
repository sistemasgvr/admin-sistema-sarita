<template>
  <AppModal
    v-model="open"
    :title="modalTitle"
    :subtitle="modalSubtitle"
    size="lg"
    @close="handleClose"
  >
    <ClienteForm
      :mode="mode"
      :cliente-id="clienteId"
      :active="open"
      :default-id-tipo-cliente="defaultIdTipoCliente"
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

const props = withDefaults(
  defineProps<{
    mode: ClienteFormMode
    cliente?: Cliente | null
    createTitle?: string
    createSubtitle?: string
    defaultIdTipoCliente?: number
  }>(),
  {
    createTitle: 'Nuevo cliente',
    createSubtitle: 'Registra un nuevo cliente en el sistema.',
  },
)

const modalTitle = computed(() =>
  props.mode === 'create' ? props.createTitle : 'Editar cliente',
)
const modalSubtitle = computed(() =>
  props.mode === 'create'
    ? props.createSubtitle
    : 'Actualiza los datos del cliente seleccionado.',
)

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