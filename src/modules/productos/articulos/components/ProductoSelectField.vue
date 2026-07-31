<template>
  <div>
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
        :loading="loading || isFetchingProductos"
        :disabled="disabled"
        :required="required"
        :error="error"
        :hint="hint"
        :empty-text="emptyText"
      />
      <AppSelect
        v-else
        v-model="model"
        :label="label"
        :placeholder="placeholder"
        :options="mergedOptions"
        :disabled="disabled || loading || isLoadingProductos"
        :required="required"
        :error="error"
        :hint="hint"
      />
    </AppSelectWithCreate>

    <ProductoFormModal v-model="modalOpen" mode="create" @saved="onCreated" />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import ProductoFormModal from '@/modules/productos/articulos/components/ProductoFormModal.vue'
import { useProductosQuery } from '@/modules/productos/articulos/composables/useProductosQuery'
import type {
  Producto,
  ProductoListFilters,
} from '@/modules/productos/articulos/interfaces/producto.interface'
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
    esGas?: boolean
    esServicio?: boolean
    esAlquilable?: boolean
    afectaStock?: boolean
    soloActivos?: number | null
    /** Si se envía, el listado incluye stock_actual de ese almacén */
    idAlmacen?: number | '' | null
  }>(),
  {
    options: undefined,
    loading: false,
    disabled: false,
    required: false,
    searchable: true,
    label: 'Producto',
    placeholder: 'Selecciona producto',
    searchPlaceholder: 'Código o nombre...',
    soloActivos: 1,
    idAlmacen: undefined,
  },
)

const model = defineModel<string | number | '' | undefined>({ default: '' })
const search = defineModel<string>('search', { default: '' })

const emit = defineEmits<{
  created: [producto: Producto]
}>()

const authStore = useAuthStore()
const modalOpen = ref(false)
const createdOption = ref<SelectOption | null>(null)
let searchTimeout: ReturnType<typeof setTimeout> | undefined

const canCreate = computed(() => authStore.hasPermission(PermisoBanderas.PRODUCTOS_CREAR))
const createTitle = computed(() =>
  props.esServicio ? 'Nuevo servicio' : 'Nuevo producto',
)

function buildFilters(buscar?: string): ProductoListFilters {
  const filters: ProductoListFilters = {
    pagina: 1,
    limite: 80,
    soloActivos: props.soloActivos,
    buscar: buscar?.trim() || undefined,
  }

  if (props.esGas !== undefined) filters.esGas = props.esGas
  if (props.esServicio !== undefined) filters.esServicio = props.esServicio
  if (props.esAlquilable !== undefined) filters.esAlquilable = props.esAlquilable
  if (props.afectaStock !== undefined) filters.afectaStock = props.afectaStock

  const idAlmacen = Number(props.idAlmacen)
  if (Number.isFinite(idAlmacen) && idAlmacen > 0) {
    filters.idAlmacen = idAlmacen
  }

  return filters
}

const productosFilters = ref<ProductoListFilters>(buildFilters())
const productosQuery = useProductosQuery(productosFilters)

const isFetchingProductos = computed(() => productosQuery.isFetching.value)
const isLoadingProductos = computed(() => productosQuery.isLoading.value)

const emptyText = computed(() => {
  if (productosQuery.isError.value) {
    return 'No se pudieron cargar productos. Reintenta.'
  }
  return 'Sin resultados'
})

watch(
  () =>
    [
      props.esGas,
      props.esServicio,
      props.esAlquilable,
      props.afectaStock,
      props.soloActivos,
      props.idAlmacen,
    ] as const,
  () => {
    productosFilters.value = buildFilters(search.value)
  },
)

watch(search, (term) => {
  if (!props.searchable) return
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    productosFilters.value = buildFilters(term)
  }, 300)
})

function productoLabel(producto: Producto) {
  const base = `${producto.codigo} — ${producto.nombre}`
  if (producto.stock_actual == null) return base
  return `${base} (stock: ${producto.stock_actual})`
}

const queryOptions = computed<SelectOption[]>(() =>
  (productosQuery.data.value?.data ?? []).map((producto) => ({
    value: producto.id,
    label: productoLabel(producto),
  })),
)

const mergedOptions = computed(() => {
  // Sin búsqueda: se puede usar un catálogo estático del padre.
  if (!props.searchable) {
    const base = props.options?.length
      ? [...props.options]
      : [...queryOptions.value]
    if (
      createdOption.value &&
      !base.some((item) => String(item.value) === String(createdOption.value!.value))
    ) {
      base.unshift(createdOption.value)
    }
    return base
  }

  // Remoto: la query filtra; no mezclar todo el catálogo del padre (rompe el buscador).
  const base = [...queryOptions.value]
  const extras: SelectOption[] = []

  if (createdOption.value) {
    extras.push(createdOption.value)
  }

  // Mantener visible la opción seleccionada si no viene en la página actual.
  if (model.value !== '' && model.value != null) {
    const selected =
      queryOptions.value.find((opt) => String(opt.value) === String(model.value)) ??
      props.options?.find((opt) => String(opt.value) === String(model.value))
    if (selected) {
      extras.push(selected)
    }
  }

  for (const opt of extras) {
    if (!base.some((item) => String(item.value) === String(opt.value))) {
      base.unshift(opt)
    }
  }
  return base
})

function onCreated(producto: Producto) {
  createdOption.value = {
    value: producto.id,
    label: productoLabel(producto),
  }
  model.value = producto.id
  void productosQuery.refetch()
  emit('created', producto)
}
</script>
