<template>
  <AppSelectWithCreate
    :can-create="canCreate"
    create-title="Nuevo cliente"
    :disabled="disabled"
    @create="modalOpen = true"
  >
    <AppSelectSearch
      v-if="searchable"
      v-model="model"
      v-model:search="search"
      remote
      :label="label"
      :placeholder="placeholder"
      :search-placeholder="searchPlaceholder"
      :options="mergedOptions"
      :loading="loading || clientesQuery.isFetching.value"
      :disabled="disabled"
      :required="required"
      :error="error"
      :hint="hint"
    />
    <AppSelect
      v-else
      v-model="model"
      :label="label"
      :placeholder="placeholder"
      :options="mergedOptions"
      :disabled="disabled || loading || clientesQuery.isLoading.value"
      :required="required"
      :error="error"
      :hint="hint"
    />
  </AppSelectWithCreate>

  <ClienteFormModal v-model="modalOpen" mode="create" @saved="onCreated" />
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import ClienteFormModal from '@/modules/clientes/components/ClienteFormModal.vue'
import { useClientesQuery } from '@/modules/clientes/composables/useClientesQuery'
import type { Cliente } from '@/modules/clientes/interfaces/cliente.interface'
import { getClienteOptionLabel } from '@/modules/clientes/utils/clienteNombre'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { AppSelect, AppSelectSearch, AppSelectWithCreate } from '@/shared/components'
import { PermisoBanderas } from '@/shared/constants/permissions'
import type { SelectOption } from '@/shared/interfaces/form.interface'

const props = withDefaults(
  defineProps<{
    options?: SelectOption[]
    loading?: boolean
    disabled?: boolean
    required?: boolean
    searchable?: boolean
    label?: string
    placeholder?: string
    searchPlaceholder?: string
    error?: string
    hint?: string
  }>(),
  {
    options: undefined,
    loading: false,
    disabled: false,
    required: false,
    searchable: true,
    label: 'Cliente',
    placeholder: 'Selecciona cliente',
    searchPlaceholder: 'Razón social, documento o código...',
  },
)

const model = defineModel<string | number | '' | undefined>({ default: '' })
const search = defineModel<string>('search', { default: '' })

const emit = defineEmits<{
  created: [cliente: Cliente]
}>()

const authStore = useAuthStore()
const modalOpen = ref(false)
const createdOption = ref<SelectOption | null>(null)

const canCreate = computed(() => authStore.hasPermission(PermisoBanderas.CLIENTES_CREAR))

const clientesFilters = ref({
  pagina: 1,
  limite: 80,
  soloActivos: 1 as number,
  buscar: undefined as string | undefined,
})
const clientesQuery = useClientesQuery(clientesFilters)

watch(search, (term) => {
  if (!props.searchable) return
  clientesFilters.value = {
    ...clientesFilters.value,
    buscar: term.trim() || undefined,
  }
})

const queryOptions = computed<SelectOption[]>(() =>
  (clientesQuery.data.value?.data ?? []).map((cliente) => ({
    value: cliente.id,
    label: getClienteOptionLabel(cliente),
  })),
)

const mergedOptions = computed(() => {
  const base = props.options?.length ? props.options : queryOptions.value
  if (!createdOption.value) return base
  if (base.some((opt) => String(opt.value) === String(createdOption.value!.value))) {
    return base
  }
  return [createdOption.value, ...base]
})

function onCreated(cliente: Cliente) {
  createdOption.value = {
    value: cliente.id,
    label: getClienteOptionLabel(cliente),
  }
  model.value = cliente.id
  void clientesQuery.refetch()
  emit('created', cliente)
}
</script>
