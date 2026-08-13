<template>
  <div class="flex items-end gap-2">
    <div class="min-w-0 flex-1">
      <AppSelectSearch
        v-model="idProducto"
        v-model:search="search"
        :label="label"
        :placeholder="placeholder"
        :search-placeholder="searchPlaceholder"
        :options="options"
        :loading="loading"
        :disabled="disabled"
      />
    </div>

    <button
      v-if="canCreate"
      type="button"
      title="Nuevo producto"
      class="mb-0 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-brand-200 bg-brand-50 text-brand-500 transition hover:border-brand-300 hover:bg-brand-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-brand-500/30 dark:bg-brand-500/10 dark:hover:bg-brand-500/20"
      :disabled="disabled"
      @click="formModalOpen = true"
    >
      <AppIcon :name="ICONS.plus" :size="18" />
    </button>

    <ProductoFormModal
      v-if="canCreate"
      v-model="formModalOpen"
      mode="create"
      @saved="onProductoSaved"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import ProductoFormModal from '@/modules/productos/articulos/components/ProductoFormModal.vue'
import type { Producto } from '@/modules/productos/articulos/interfaces/producto.interface'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { AppSelectSearch } from '@/shared/components'
import AppIcon from '@/shared/components/AppIcon.vue'
import { ICONS } from '@/shared/constants/icons'
import { PermisoBanderas } from '@/shared/constants/permissions'
import type { SelectOption } from '@/shared/interfaces/form.interface'

withDefaults(
  defineProps<{
    options: SelectOption[]
    loading?: boolean
    disabled?: boolean
    label?: string
    placeholder?: string
    searchPlaceholder?: string
  }>(),
  {
    loading: false,
    disabled: false,
    label: 'Producto',
    placeholder: 'Buscar producto...',
    searchPlaceholder: 'Código o nombre...',
  },
)

const idProducto = defineModel<number | ''>({ default: '' })
const search = defineModel<string>('search', { default: '' })

const emit = defineEmits<{
  created: [producto: Producto]
}>()

const authStore = useAuthStore()
const canCreate = computed(() => authStore.hasPermission(PermisoBanderas.PRODUCTOS_CREAR))

const formModalOpen = ref(false)

function onProductoSaved(producto?: Producto) {
  if (!producto) return
  emit('created', producto)
}
</script>
