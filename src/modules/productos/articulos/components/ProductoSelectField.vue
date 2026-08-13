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
        :remote="useRemote"
        :label="label"
        :placeholder="placeholder"
        :search-placeholder="searchPlaceholder"
        :options="mergedOptions"
        :loading="loading || isFetchingProductos"
        :disabled="disabled"
        :required="required"
        :error="error"
        :hint="hint"
        :help="help"
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
        :help="help"
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
import { filtrarProductosCatalogo } from '@/modules/productos/articulos/utils/productosSistema'
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
    /**
     * true = cada tecla consulta API.
     * false = carga catálogo filtrado y filtra en cliente.
     * omitir = auto (catálogos gas/servicio/alquilable → local; resto → remoto).
     */
    remote?: boolean
    label?: string
    placeholder?: string
    searchPlaceholder?: string
    error?: string
    hint?: string
    help?: string
    /**
     * Filtros tri-estado. Default `undefined` (no `false`): en Vue un boolean
     * opcional sin default se castea a false y rompía listados (ej. gases con
     * afecta_stock=true al pedir afectaStock=false).
     */
    esGas?: boolean
    esServicio?: boolean
    esAlquilable?: boolean
    afectaStock?: boolean
    soloActivos?: number | null
    /** Si se envía, el listado incluye stock_actual de ese almacén */
    idAlmacen?: number | '' | null
    /**
     * Con idAlmacen: no permite elegir productos que afectan stock y tienen stock ≤ 0.
     * Aparecen deshabilitados en el listado.
     */
    bloquearSinStock?: boolean
  }>(),
  {
    options: undefined,
    loading: false,
    disabled: false,
    required: false,
    searchable: true,
    remote: undefined,
    label: 'Producto',
    placeholder: 'Selecciona producto',
    searchPlaceholder: 'Código o nombre...',
    esGas: undefined,
    esServicio: undefined,
    esAlquilable: undefined,
    afectaStock: undefined,
    soloActivos: 1,
    idAlmacen: undefined,
    bloquearSinStock: false,
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

/** Catálogos acotados: carga una vez + filtro local (mismo patrón que POS Recarga). */
const useRemote = computed(() => {
  if (props.remote !== undefined) return props.remote
  const catalogoAcotado =
    props.esGas === true ||
    props.esServicio === true ||
    props.esAlquilable === true ||
    props.afectaStock === true
  return !catalogoAcotado
})

function buildFilters(buscar?: string): ProductoListFilters {
  const filters: ProductoListFilters = {
    pagina: 1,
    limite: useRemote.value ? 80 : 200,
    soloActivos: props.soloActivos,
    incluirImagenes: false,
    buscar: useRemote.value ? buscar?.trim() || undefined : undefined,
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
  if (isFetchingProductos.value || isLoadingProductos.value) {
    return 'Cargando productos...'
  }
  if (search.value.trim()) {
    return 'Sin coincidencias. Borra el buscador para ver el listado.'
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
      useRemote.value,
    ] as const,
  () => {
    productosFilters.value = buildFilters(useRemote.value ? search.value : undefined)
  },
)

watch(
  () => search.value,
  (term) => {
    if (!props.searchable || !useRemote.value) return
    if (searchTimeout) clearTimeout(searchTimeout)
    searchTimeout = setTimeout(() => {
      productosFilters.value = buildFilters(term)
    }, 300)
  },
)

function productoLabel(producto: Producto) {
  const base = `${producto.codigo} — ${producto.nombre}`
  if (producto.stock_actual == null) return base
  return `${base} (stock: ${producto.stock_actual})`
}

function productoToSelectOption(producto: Producto): SelectOption {
  const badges: NonNullable<SelectOption['badges']> = []
  if (producto.es_gas) badges.push({ label: 'Gas', color: 'primary' })
  if (producto.es_servicio) badges.push({ label: 'Servicio', color: 'neutral' })
  if (producto.es_alquilable) badges.push({ label: 'Alquilable', color: 'warning' })
  if (producto.nombre_categoria) {
    badges.push({ label: producto.nombre_categoria, color: 'neutral' })
  }
  if (producto.nombre_sub_categoria) {
    badges.push({ label: producto.nombre_sub_categoria, color: 'neutral' })
  }
  if (producto.nombre_unidad_medida) {
    badges.push({ label: producto.nombre_unidad_medida, color: 'neutral' })
  }
  if (producto.presentacion) {
    badges.push({ label: producto.presentacion, color: 'neutral' })
  }
  if (producto.marca) {
    badges.push({ label: producto.marca, color: 'neutral' })
  }
  if (producto.stock_actual != null) {
    badges.push({
      label: `Stock: ${producto.stock_actual}`,
      color: Number(producto.stock_actual) <= 0 ? 'error' : 'success',
    })
  }

  return {
    value: producto.id,
    title: `${producto.codigo} — ${producto.nombre}`,
    label: productoLabel(producto),
    badges,
    disabled: productoBloqueadoPorStock(producto),
  }
}

function productoBloqueadoPorStock(producto: Producto) {
  if (!props.bloquearSinStock) return false
  if (!Number(props.idAlmacen)) return false
  if (producto.es_gas || producto.es_servicio) return false
  if (producto.afecta_stock === false) return false
  if (producto.stock_actual == null) return false
  return Number(producto.stock_actual) <= 0
}

const productosCatalogo = computed(() => {
  const rows = productosQuery.data.value?.data
  if (!Array.isArray(rows)) return []
  return filtrarProductosCatalogo(rows)
})

const queryOptions = computed<SelectOption[]>(() =>
  productosCatalogo.value.map((producto) => productoToSelectOption(producto)),
)

watch(
  () => [model.value, props.bloquearSinStock, props.idAlmacen, productosCatalogo.value] as const,
  () => {
    if (!props.bloquearSinStock || model.value === '' || model.value == null) return
    const selected = productosCatalogo.value.find(
      (item) => String(item.id) === String(model.value),
    )
    if (selected && productoBloqueadoPorStock(selected)) {
      model.value = ''
    }
  },
)

const mergedOptions = computed(() => {
  if (!props.searchable) {
    const base = props.options?.length ? [...props.options] : [...queryOptions.value]
    if (
      createdOption.value &&
      !base.some((item) => String(item.value) === String(createdOption.value!.value))
    ) {
      base.unshift(createdOption.value)
    }
    return base
  }

  const base = [...queryOptions.value]
  const extras: SelectOption[] = []

  if (createdOption.value) {
    extras.push(createdOption.value)
  }

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

function onCreated(producto?: Producto) {
  if (!producto) {
    void productosQuery.refetch()
    return
  }
  createdOption.value = productoToSelectOption(producto)
  model.value = producto.id
  void productosQuery.refetch()
  emit('created', producto)
}
</script>
