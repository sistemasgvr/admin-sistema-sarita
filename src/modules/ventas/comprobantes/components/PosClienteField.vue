<template>
  <div class="flex items-end gap-2">
    <div class="min-w-0 flex-1">
      <AppSelectSearch
        v-model="idCliente"
        v-model:search="search"
        remote
        :label="label"
        :placeholder="placeholder"
        :search-placeholder="searchPlaceholder"
        :options="options"
        :loading="loading"
        :disabled="disabled"
        :required="required"
      />
    </div>

    <button
      v-if="canCreate"
      type="button"
      title="Nuevo cliente"
      class="mb-0 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-brand-200 bg-brand-50 text-brand-500 transition hover:border-brand-300 hover:bg-brand-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-brand-500/30 dark:bg-brand-500/10 dark:hover:bg-brand-500/20"
      :disabled="disabled"
      @click="formModalOpen = true"
    >
      <AppIcon :name="ICONS.plus" :size="18" />
    </button>

    <ClienteFormModal v-model="formModalOpen" mode="create" @saved="onClienteSaved" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import ClienteFormModal from '@/modules/clientes/components/ClienteFormModal.vue'
import type { Cliente } from '@/modules/clientes/interfaces/cliente.interface'
import { AppSelectSearch } from '@/shared/components'
import AppIcon from '@/shared/components/AppIcon.vue'
import { ICONS } from '@/shared/constants/icons'
import type { SelectOption } from '@/shared/interfaces/form.interface'

withDefaults(
  defineProps<{
    options: SelectOption[]
    loading?: boolean
    disabled?: boolean
    required?: boolean
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

const formModalOpen = ref(false)

function onClienteSaved(cliente: Cliente) {
  emit('created', cliente)
}
</script>
