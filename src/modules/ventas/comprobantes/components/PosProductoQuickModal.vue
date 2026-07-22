<template>
  <AppModal
    v-model="open"
    :title="producto?.nombre || 'Producto'"
    :subtitle="subtitle"
    size="lg"
  >
    <AppTabs v-model="tab" :tabs="tabs" aria-label="Información del producto" full-width>
      <template #ubicacion>
        <div class="space-y-4 pt-1">
          <div
            class="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-6 text-center dark:border-gray-800 dark:bg-white/[0.03]"
          >
            <p class="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Código de ubicación
            </p>
            <p
              v-if="ubicacion"
              class="mt-2 break-all font-mono text-3xl font-semibold tracking-wide text-gray-900 dark:text-white"
            >
              {{ ubicacion }}
            </p>
            <p v-else class="mt-3 text-sm text-gray-500 dark:text-gray-400">
              Este producto no tiene código de ubicación asignado.
            </p>
            <button
              v-if="ubicacion"
              type="button"
              class="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-brand-500 px-3.5 py-2 text-sm font-medium text-white hover:bg-brand-600"
              @click="copiarUbicacion"
            >
              <AppIcon :name="ICONS.copy" :size="16" />
              Copiar ubicación
            </button>
          </div>

          <dl class="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div class="rounded-xl border border-gray-100 px-3 py-2.5 dark:border-gray-800">
              <dt class="text-xs text-gray-500 dark:text-gray-400">Código</dt>
              <dd class="mt-0.5 text-sm font-medium text-gray-800 dark:text-white/90">
                {{ producto?.codigo || '—' }}
              </dd>
            </div>
            <div class="rounded-xl border border-gray-100 px-3 py-2.5 dark:border-gray-800">
              <dt class="text-xs text-gray-500 dark:text-gray-400">Stock</dt>
              <dd
                class="mt-0.5 text-sm font-medium"
                :class="
                  producto?.stock_bajo || Number(producto?.stock_actual) <= 0
                    ? 'text-error-500'
                    : 'text-gray-800 dark:text-white/90'
                "
              >
                {{
                  producto?.stock_actual != null
                    ? formatStock(producto.stock_actual)
                    : '—'
                }}
              </dd>
            </div>
            <div class="rounded-xl border border-gray-100 px-3 py-2.5 dark:border-gray-800">
              <dt class="text-xs text-gray-500 dark:text-gray-400">Categoría</dt>
              <dd class="mt-0.5 text-sm font-medium text-gray-800 dark:text-white/90">
                {{ producto?.nombre_categoria || '—' }}
                <span v-if="producto?.nombre_sub_categoria">
                  / {{ producto.nombre_sub_categoria }}
                </span>
              </dd>
            </div>
            <div class="rounded-xl border border-gray-100 px-3 py-2.5 dark:border-gray-800">
              <dt class="text-xs text-gray-500 dark:text-gray-400">Marca</dt>
              <dd class="mt-0.5 text-sm font-medium text-gray-800 dark:text-white/90">
                {{ producto?.marca || '—' }}
              </dd>
            </div>
          </dl>
        </div>
      </template>

      <template #imagenes>
        <div class="pt-1">
          <ProductoImagenesManager
            v-if="producto?.id"
            :id-producto="producto.id"
            :editable="false"
          />
        </div>
      </template>
    </AppTabs>

    <template #footer>
      <button
        type="button"
        class="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-3.5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
        @click="open = false"
      >
        Cerrar
      </button>
      <button
        v-if="puedeAgregar"
        type="button"
        class="inline-flex items-center justify-center gap-1.5 rounded-lg bg-brand-500 px-3.5 py-2 text-sm font-medium text-white hover:bg-brand-600"
        @click="agregar"
      >
        <AppIcon :name="ICONS.plus" :size="16" />
        Agregar al carrito
      </button>
    </template>
  </AppModal>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import ProductoImagenesManager from '@/modules/productos/articulos/components/ProductoImagenesManager.vue'
import type { Producto } from '@/modules/productos/articulos/interfaces/producto.interface'
import { productoSinStockParaVenta } from '@/modules/ventas/comprobantes/utils/stockPos'
import { AppModal, AppTabs } from '@/shared/components'
import AppIcon from '@/shared/components/AppIcon.vue'
import { toastSuccess, toastWarning } from '@/shared/composables/useToast'
import { ICONS } from '@/shared/constants/icons'
import type { AppTabItem } from '@/shared/interfaces/tabs.interface'

export type PosProductoQuickTab = 'ubicacion' | 'imagenes'

const props = withDefaults(
  defineProps<{
    producto?: Producto | null
    initialTab?: PosProductoQuickTab
  }>(),
  {
    producto: null,
    initialTab: 'ubicacion',
  },
)

const emit = defineEmits<{
  add: [producto: Producto]
}>()

const open = defineModel<boolean>({ default: false })
const tab = ref<PosProductoQuickTab>('ubicacion')

const ubicacion = computed(() => (props.producto?.codigo_ubicacion ?? '').trim())

const subtitle = computed(() => {
  const codigo = props.producto?.codigo?.trim()
  if (!codigo) return undefined
  return ubicacion.value ? `${codigo} · Ub: ${ubicacion.value}` : codigo
})

const puedeAgregar = computed(
  () => Boolean(props.producto) && !productoSinStockParaVenta(props.producto!),
)

const tabs = computed<AppTabItem[]>(() => [
  { key: 'ubicacion', label: 'Ubicación', icon: ICONS.mapPin },
  { key: 'imagenes', label: 'Imágenes', icon: ICONS.images },
])

watch(
  () => [open.value, props.initialTab] as const,
  ([isOpen, initial]) => {
    if (isOpen) tab.value = initial
  },
)

async function copiarUbicacion() {
  if (!ubicacion.value) return
  try {
    await navigator.clipboard.writeText(ubicacion.value)
    toastSuccess(`Ubicación copiada: ${ubicacion.value}`)
  } catch {
    toastWarning('No se pudo copiar la ubicación')
  }
}

function agregar() {
  if (!props.producto) return
  if (productoSinStockParaVenta(props.producto)) {
    toastWarning(`${props.producto.nombre} no tiene stock disponible`)
    return
  }
  emit('add', props.producto)
  open.value = false
}

function formatStock(value: number | null | undefined) {
  return new Intl.NumberFormat('es-PE', {
    maximumFractionDigits: 2,
  }).format(Number(value || 0))
}
</script>
