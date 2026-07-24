<template>
  <ClienteSelectField
    v-model="idCliente"
    v-model:search="search"
    :options="options"
    :loading="loading"
    :disabled="disabled"
    :required="required"
    :label="label"
    :placeholder="placeholder"
    :search-placeholder="searchPlaceholder"
    @created="emit('created', $event)"
  />
</template>

<script setup lang="ts">
import ClienteSelectField from '@/modules/clientes/components/ClienteSelectField.vue'
import type { Cliente } from '@/modules/clientes/interfaces/cliente.interface'
import type { SelectOption } from '@/shared/interfaces/form.interface'

withDefaults(
  defineProps<{
    options: SelectOption[]
    loading?: boolean
    disabled?: boolean
    required?: boolean
    /** Kept for POS API compat; create permission is resolved inside ClienteSelectField. */
    canCreate?: boolean
    label?: string
    placeholder?: string
    searchPlaceholder?: string
  }>(),
  {
    loading: false,
    disabled: false,
    required: false,
    canCreate: false,
    label: 'Cliente',
    placeholder: 'Selecciona cliente',
    searchPlaceholder: 'Razón social, documento o código...',
  },
)

const idCliente = defineModel<number | ''>({ default: '' })
const search = defineModel<string>('search', { default: '' })

const emit = defineEmits<{
  created: [cliente: Cliente]
}>()
</script>
