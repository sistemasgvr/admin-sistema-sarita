<template>
  <AppSelectWithCreate
    :can-create="canCreate"
    :create-title="createTitle"
    :disabled="disabled"
    :has-label="Boolean(label?.trim())"
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
import { useListaOpcionesQuery } from '@/modules/catalogos/composables/useListaOpcionesQuery'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { AppSelect, AppSelectSearch, AppSelectWithCreate } from '@/shared/components'
import { ListaIds, TipoClienteIds } from '@/shared/constants/lista-ids'
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
    /**
     * Solo CLIENTE + CLIENTE/PROVEEDOR (excluye proveedores puros).
     * Ignorado si soloProveedores.
     */
    soloClientes?: boolean
    /** Filtro único por tipo (ignorado si soloProveedores / soloClientes). */
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
    soloClientes: false,
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

const listaTipoClienteId = ref(ListaIds.TIPO_CLIENTE)
const tipoClienteQuery = useListaOpcionesQuery(listaTipoClienteId)

function idTipoClientePorNombre(nombre: string): number | undefined {
  return tipoClienteQuery.data.value?.find(
    (opcion) => opcion.nombre?.toUpperCase() === nombre,
  )?.id
}

const idTipoSoloCliente = computed(
  () => idTipoClientePorNombre('CLIENTE') ?? idTipoClientePorNombre('Cliente'),
)

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
    (props.soloProveedores
      ? TipoClienteIds.PROVEEDOR
      : props.soloClientes
        ? idTipoSoloCliente.value
        : undefined),
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

function extraFiltroTipo(): Partial<ClienteListFilters> {
  if (props.soloProveedores) {
    return { idTipoCliente: TipoClienteIds.PROVEEDOR }
  }
  if (props.soloClientes && idTipoSoloCliente.value) {
    return { idTipoCliente: idTipoSoloCliente.value }
  }
  if (props.idTipoCliente) {
    return { idTipoCliente: props.idTipoCliente }
  }
  return {}
}

const clientesFilters = ref<ClienteListFilters>(baseFilters(extraFiltroTipo()))
const clienteProveedoresFilters = ref<ClienteListFilters>(
  baseFilters({ idTipoCliente: TipoClienteIds.CLIENTE_PROVEEDOR }),
)

const usaClienteProveedor = computed(() => props.soloProveedores || props.soloClientes)

const clientesQuery = useClientesQuery(clientesFilters)
const clienteProveedoresQuery = useClientesQuery(
  clienteProveedoresFilters,
  () => usaClienteProveedor.value,
)

function syncTipoFilters() {
  clientesFilters.value = baseFilters(extraFiltroTipo())
  if (usaClienteProveedor.value) {
    clienteProveedoresFilters.value = baseFilters({
      idTipoCliente: TipoClienteIds.CLIENTE_PROVEEDOR,
    })
  }
}

watch(search, (term) => {
  if (!props.searchable) return
  const buscar = term.trim() || undefined
  clientesFilters.value = { ...clientesFilters.value, buscar }
  if (usaClienteProveedor.value) {
    clienteProveedoresFilters.value = { ...clienteProveedoresFilters.value, buscar }
  }
})

watch(
  () =>
    [props.soloProveedores, props.soloClientes, props.idTipoCliente, idTipoSoloCliente.value] as const,
  () => {
    syncTipoFilters()
  },
)

const isFetching = computed(
  () =>
    clientesQuery.isFetching.value ||
    (usaClienteProveedor.value && clienteProveedoresQuery.isFetching.value),
)
const isLoading = computed(
  () =>
    clientesQuery.isLoading.value ||
    (usaClienteProveedor.value && clienteProveedoresQuery.isLoading.value),
)

const queryOptions = computed<SelectOption[]>(() => {
  const rows = usaClienteProveedor.value
    ? [
        ...(clientesQuery.data.value?.data ?? []),
        ...(clienteProveedoresQuery.data.value?.data ?? []),
      ]
    : (clientesQuery.data.value?.data ?? [])

  const seen = new Set<number>()
  const options: SelectOption[] = []
  for (const cliente of rows) {
    if (seen.has(cliente.id)) continue
    if (props.soloClientes) {
      const tipo = cliente.nombre_tipo_cliente?.toUpperCase() ?? ''
      if (tipo === 'PROVEEDOR') continue
    }
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
  if (usaClienteProveedor.value) void clienteProveedoresQuery.refetch()
  emit('created', cliente)
}
</script>
