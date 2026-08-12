<template>
  <AppSelectWithCreate
    :can-create="canCreate"
    :create-title="createTitle"
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
      :loading="loading || isFetching"
      :disabled="disabled"
      :required="required"
      :error="error"
      :hint="hint"
      :help="help"
    />
    <AppSelect
      v-else
      v-model="model"
      :label="label"
      :placeholder="placeholder"
      :options="mergedOptions"
      :disabled="disabled || loading || isLoading"
      :required="required"
      :error="error"
      :hint="hint"
      :help="help"
    />
  </AppSelectWithCreate>

  <ClienteFormModal
    v-model="modalOpen"
    mode="create"
    :create-title="createTitle"
    :create-subtitle="createSubtitle"
    :default-id-tipo-cliente="resolvedDefaultTipoCliente"
    @saved="onCreated"
  />
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import ClienteFormModal from '@/modules/clientes/components/ClienteFormModal.vue'
import { useClientesQuery } from '@/modules/clientes/composables/useClientesQuery'
import type { Cliente, ClienteListFilters } from '@/modules/clientes/interfaces/cliente.interface'
import { getClienteOptionLabel } from '@/modules/clientes/utils/clienteNombre'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { AppSelect, AppSelectSearch, AppSelectWithCreate } from '@/shared/components'
import { TipoClienteIds } from '@/shared/constants/lista-ids'
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
    help?: string
    /**
     * Solo PROVEEDOR + CLIENTE/PROVEEDOR (como en Compras).
     * Útil en planta externa / compras.
     */
    soloProveedores?: boolean
    /** Filtro único por tipo (ignorado si soloProveedores). */
    idTipoCliente?: number
    createTitle?: string
    createSubtitle?: string
    defaultIdTipoCliente?: number
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
    soloProveedores: false,
    createTitle: undefined,
    createSubtitle: undefined,
    defaultIdTipoCliente: undefined,
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

const createTitle = computed(
  () => props.createTitle ?? (props.soloProveedores ? 'Nuevo proveedor' : 'Nuevo cliente'),
)
const createSubtitle = computed(
  () =>
    props.createSubtitle ??
    (props.soloProveedores
      ? 'Registra un proveedor (planta / empresa a la que compras).'
      : 'Registra un nuevo cliente en el sistema.'),
)
const resolvedDefaultTipoCliente = computed(
  () =>
    props.defaultIdTipoCliente ??
    (props.soloProveedores ? TipoClienteIds.PROVEEDOR : undefined),
)

function baseFilters(extra: Partial<ClienteListFilters> = {}): ClienteListFilters {
  return {
    pagina: 1,
    limite: 80,
    soloActivos: 1,
    buscar: search.value.trim() || undefined,
    ...extra,
  }
}

const clientesFilters = ref<ClienteListFilters>(
  baseFilters(
    props.soloProveedores
      ? { idTipoCliente: TipoClienteIds.PROVEEDOR }
      : props.idTipoCliente
        ? { idTipoCliente: props.idTipoCliente }
        : {},
  ),
)
const clienteProveedoresFilters = ref<ClienteListFilters>(
  baseFilters({ idTipoCliente: TipoClienteIds.CLIENTE_PROVEEDOR }),
)

const clientesQuery = useClientesQuery(clientesFilters)
const clienteProveedoresQuery = useClientesQuery(
  clienteProveedoresFilters,
  () => props.soloProveedores,
)

watch(search, (term) => {
  if (!props.searchable) return
  const buscar = term.trim() || undefined
  clientesFilters.value = { ...clientesFilters.value, buscar }
  if (props.soloProveedores) {
    clienteProveedoresFilters.value = { ...clienteProveedoresFilters.value, buscar }
  }
})

watch(
  () => [props.soloProveedores, props.idTipoCliente] as const,
  ([soloProv, idTipo]) => {
    clientesFilters.value = baseFilters(
      soloProv
        ? { idTipoCliente: TipoClienteIds.PROVEEDOR }
        : idTipo
          ? { idTipoCliente: idTipo }
          : {},
    )
    if (soloProv) {
      clienteProveedoresFilters.value = baseFilters({
        idTipoCliente: TipoClienteIds.CLIENTE_PROVEEDOR,
      })
    }
  },
)

const isFetching = computed(
  () =>
    clientesQuery.isFetching.value ||
    (props.soloProveedores && clienteProveedoresQuery.isFetching.value),
)
const isLoading = computed(
  () =>
    clientesQuery.isLoading.value ||
    (props.soloProveedores && clienteProveedoresQuery.isLoading.value),
)

const queryOptions = computed<SelectOption[]>(() => {
  const rows = props.soloProveedores
    ? [
        ...(clientesQuery.data.value?.data ?? []),
        ...(clienteProveedoresQuery.data.value?.data ?? []),
      ]
    : (clientesQuery.data.value?.data ?? [])

  const seen = new Set<number>()
  const options: SelectOption[] = []
  for (const cliente of rows) {
    if (seen.has(cliente.id)) continue
    seen.add(cliente.id)
    options.push({ value: cliente.id, label: getClienteOptionLabel(cliente) })
  }
  return options
})

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
  if (props.soloProveedores) void clienteProveedoresQuery.refetch()
  emit('created', cliente)
}
</script>
