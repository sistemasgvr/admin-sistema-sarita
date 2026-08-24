<template>
  <AppModal
    v-model="open"
    title="Escanear producto"
    subtitle="Apunta la pistola al código o escríbelo y pulsa Enter."
    size="sm"
  >
    <form class="space-y-3" autocomplete="off" @submit.prevent="onSubmit">
      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
        Código
        <span class="text-error-500" aria-hidden="true">*</span>
      </label>
      <input
        ref="codigoInputRef"
        v-model="codigo"
        type="text"
        name="codigo-scan"
        class="form-control w-full"
        :class="{ 'form-control-error': Boolean(error) }"
        placeholder="Escanea o escribe el código..."
        :disabled="loading"
        autocomplete="off"
        @keydown.enter.prevent="onSubmit"
      />
      <p v-if="error" class="text-theme-xs text-error-500">{{ error }}</p>
      <p v-else class="text-theme-xs text-gray-500 dark:text-gray-400">
        Busca por código de barras, código interno o ubicación. La pistola suele
        enviar Enter al final.
      </p>
    </form>

    <template #footer>
      <button
        type="button"
        class="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-white/[0.03]"
        :disabled="loading"
        @click="open = false"
      >
        Cancelar
      </button>
      <button
        type="button"
        class="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-70"
        :disabled="loading || !codigo.trim()"
        @click="onSubmit"
      >
        <AppIcon
          v-if="loading"
          :name="ICONS.loader"
          :size="16"
          class="animate-spin"
        />
        {{ loading ? 'Buscando...' : 'Buscar' }}
      </button>
    </template>
  </AppModal>
</template>

<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'
import {
  buscarProductoPorCodigo,
  type BuscarProductoPorCodigoFilters,
} from '@/modules/productos/articulos/utils/buscarProductoPorCodigo'
import type { Producto } from '@/modules/productos/articulos/interfaces/producto.interface'
import { AppModal } from '@/shared/components'
import AppIcon from '@/shared/components/AppIcon.vue'
import { ICONS } from '@/shared/constants/icons'
import { toastError, toastWarning } from '@/shared/composables/useToast'

const props = withDefaults(
  defineProps<{
    filters?: BuscarProductoPorCodigoFilters
  }>(),
  {
    filters: () => ({}),
  },
)

const open = defineModel<boolean>({ default: false })

const emit = defineEmits<{
  scanned: [producto: Producto]
}>()

const codigo = ref('')
const error = ref('')
const loading = ref(false)
const codigoInputRef = ref<HTMLInputElement | null>(null)

function focusInput() {
  void nextTick(() => {
    codigoInputRef.value?.focus()
    codigoInputRef.value?.select()
  })
}

watch(open, (isOpen) => {
  if (!isOpen) {
    codigo.value = ''
    error.value = ''
    loading.value = false
    return
  }
  focusInput()
})

async function onSubmit() {
  const term = codigo.value.trim()
  if (!term || loading.value) return

  loading.value = true
  error.value = ''
  try {
    const { producto, candidatos } = await buscarProductoPorCodigo(term, props.filters)
    if (!producto) {
      const msg =
        candidatos.length > 1
          ? 'Varios productos coinciden. Afina el código o elige manualmente.'
          : 'No se encontró un producto con ese código.'
      error.value = msg
      toastWarning(msg)
      focusInput()
      return
    }
    emit('scanned', producto)
    open.value = false
  } catch {
    error.value = 'No se pudo buscar el producto'
    toastError('No se pudo buscar el producto')
  } finally {
    loading.value = false
  }
}
</script>
