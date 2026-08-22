<template>
  <button
    type="button"
    :aria-label="title"
    :title="title"
    class="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition hover:border-brand-300 hover:bg-brand-50 hover:text-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:border-brand-500/40 dark:hover:bg-brand-500/10 dark:hover:text-brand-400 dark:focus-visible:ring-offset-gray-900"
    :disabled="disabled"
    @click="open = true"
  >
    <AppIcon :name="ICONS.scanBarcode" :size="18" aria-hidden="true" />
    <span class="sr-only">{{ title }}</span>
  </button>

  <ProductoBarcodeScanModal
    v-model="open"
    :filters="filters"
    @scanned="(producto) => emit('scanned', producto)"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import ProductoBarcodeScanModal from '@/modules/productos/articulos/components/ProductoBarcodeScanModal.vue'
import type { BuscarProductoPorCodigoFilters } from '@/modules/productos/articulos/utils/buscarProductoPorCodigo'
import type { Producto } from '@/modules/productos/articulos/interfaces/producto.interface'
import AppIcon from '@/shared/components/AppIcon.vue'
import { ICONS } from '@/shared/constants/icons'

withDefaults(
  defineProps<{
    disabled?: boolean
    title?: string
    filters?: BuscarProductoPorCodigoFilters
  }>(),
  {
    disabled: false,
    title: 'Escanear con pistola',
    filters: () => ({}),
  },
)

const emit = defineEmits<{
  scanned: [producto: Producto]
}>()

const open = ref(false)
</script>
