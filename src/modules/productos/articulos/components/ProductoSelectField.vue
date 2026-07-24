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
      :loading="loading || productosQuery.isFetching.value"
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
      :disabled="disabled || loading || productosQuery.isLoading.value"
      :required="required"
      :error="error"
      :hint="hint"
    />
  </AppSelectWithCreate>

  <ProductoFormModal v-model="modalOpen" mode="create" @saved="onCreated" />
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import ProductoFormModal from '@/modules/productos/articulos/components/ProductoFormModal.vue'
import { useProductosQuery } from '@/modules/productos/articulos/composables/useProductosQuery'
import type { Producto } from '@/modules/productos/articulos/interfaces/producto.interface'
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
    soloActivos?: number | null
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

const canCreate = computed(() => authStore.hasPermission(PermisoBanderas.PRODUCTOS_CREAR))
const createTitle = computed(() =>
  props.esServicio ? 'Nuevo servicio' : 'Nuevo producto',
)

const productosFilters = ref({
  pagina: 1,
  limite: 80,
  soloActivos: props.soloActivos,
  esGas: props.esGas,
  esServicio: props.esServicio,
  esAlquilable: props.esAlquilable,
  buscar: undefined as string | undefined,
})
const productosQuery = useProductosQuery(productosFilters)

watch(
  () =>
    [props.esGas, props.esServicio, props.esAlquilable, props.soloActivos] as const,
  ([esGas, esServicio, esAlquilable, soloActivos]) => {
    productosFilters.value = {
      ...productosFilters.value,
      esGas,
      esServicio,
      esAlquilable,
      soloActivos,
    }
  },
)

watch(search, (term) => {
  if (!props.searchable) return
  productosFilters.value = {
    ...productosFilters.value,
    buscar: term.trim() || undefined,
  }
})

function productoLabel(producto: Producto) {
  return `${producto.codigo} — ${producto.nombre}`
}

const queryOptions = computed<SelectOption[]>(() =>
  (productosQuery.data.value?.data ?? []).map((producto) => ({
    value: producto.id,
    label: productoLabel(producto),
  })),
)

const mergedOptions = computed(() => {
  const base = [...queryOptions.value]
  const extras = [
    ...(props.options ?? []),
    ...(createdOption.value ? [createdOption.value] : []),
  ]
  for (const opt of [...extras].reverse()) {
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
