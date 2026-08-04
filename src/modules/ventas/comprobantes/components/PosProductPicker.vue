<template>
  <div class="rounded-xl border border-gray-200 dark:border-gray-800">
    <div
      class="flex flex-col gap-3 border-b border-gray-200 px-4 py-3 dark:border-gray-800 lg:flex-row lg:items-center"
    >
      <div class="flex shrink-0 items-center gap-2.5">
        <span
          class="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-500 dark:bg-brand-500/15 dark:text-brand-400"
        >
          <AppIcon :name="ICONS.package" :size="16" />
        </span>
        <div class="flex items-baseline gap-2">
          <h3 class="text-sm font-semibold text-gray-800 dark:text-white/90">Catálogo</h3>
          <span class="text-xs text-gray-500 dark:text-gray-400">
            {{ productos.length }}<span v-if="total != null">/{{ total }}</span>
          </span>
        </div>
      </div>

      <AppListToolbar
        v-model:search="search"
        v-model:filters="filters"
        class="min-w-0 flex-1"
        :filter-fields="filterFields"
        search-placeholder="Código, ubicación, nombre o marca..."
        @filter-change="emit('filter-change')"
      >
        <template #actions>
          <div class="inline-flex shrink-0 rounded-lg border border-gray-200 p-1 dark:border-gray-700">
            <button
              type="button"
              title="Vista galería"
              class="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium transition"
              :class="
                vista === 'gallery'
                  ? 'bg-brand-500 text-white shadow-theme-xs'
                  : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5'
              "
              @click="vista = 'gallery'"
            >
              <AppIcon :name="ICONS.layoutGrid" :size="16" />
              <span class="hidden sm:inline">Galería</span>
            </button>
            <button
              type="button"
              title="Vista listado"
              class="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium transition"
              :class="
                vista === 'list'
                  ? 'bg-brand-500 text-white shadow-theme-xs'
                  : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5'
              "
              @click="vista = 'list'"
            >
              <AppIcon :name="ICONS.list" :size="16" />
              <span class="hidden sm:inline">Listado</span>
            </button>
          </div>
        </template>
      </AppListToolbar>
    </div>

    <div v-if="loading" class="flex items-center justify-center gap-2 py-16 text-sm text-gray-500">
      <AppIcon :name="ICONS.loader" :size="18" class="animate-spin" />
      Cargando productos...
    </div>

    <div
      v-else-if="productos.length === 0"
      class="py-16 text-center text-sm text-gray-500 dark:text-gray-400"
    >
      No hay productos que coincidan con los filtros.
    </div>

    <div
      v-else-if="vista === 'gallery'"
      class="grid grid-cols-1 gap-2.5 p-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-2 2xl:grid-cols-3"
    >
      <div
        v-for="producto in productos"
        :key="producto.id"
        class="group flex gap-2.5 rounded-xl border border-gray-200 bg-white p-2.5 text-left transition dark:border-gray-800 dark:bg-white/[0.02]"
        :class="
          productoSinStockParaVenta(producto)
            ? 'opacity-80'
            : 'hover:border-brand-400 hover:shadow-theme-xs dark:hover:border-brand-500'
        "
      >
        <button
          type="button"
          class="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-gray-100 bg-gray-50 transition dark:border-gray-800 dark:bg-white/5"
          :class="
            productoSinStockParaVenta(producto)
              ? ''
              : 'group-hover:border-brand-200 group-hover:bg-brand-50/60 dark:group-hover:border-brand-500/30 dark:group-hover:bg-brand-500/10'
          "
          :title="producto.url_imagen_principal ? 'Ver imágenes' : 'Sin imagen'"
          @click="openQuick(producto, 'imagenes')"
        >
          <img
            v-if="producto.url_imagen_principal"
            :src="producto.url_imagen_principal"
            :alt="producto.nombre"
            class="h-full w-full object-contain p-1"
            loading="lazy"
          />
          <AppIcon
            v-else
            :name="ICONS.package"
            :size="22"
            class="text-gray-400"
            :class="productoSinStockParaVenta(producto) ? '' : 'group-hover:text-brand-500'"
          />
          <span
            v-if="productoSinStockParaVenta(producto)"
            class="absolute inset-x-0 bottom-0 bg-error-500/90 px-0.5 py-px text-center text-[9px] font-semibold uppercase tracking-wide text-white"
          >
            Agotado
          </span>
        </button>

        <div class="flex min-w-0 flex-1 flex-col">
          <button
            type="button"
            class="min-w-0 flex-1 text-left"
            :disabled="productoSinStockParaVenta(producto)"
            :title="
              productoSinStockParaVenta(producto) ? 'Sin stock disponible' : 'Agregar al carrito'
            "
            :class="productoSinStockParaVenta(producto) ? 'cursor-not-allowed' : ''"
            @click="onAdd(producto)"
          >
            <p class="line-clamp-2 text-sm font-medium leading-snug text-gray-800 dark:text-white/90">
              {{ producto.nombre }}
            </p>
            <p class="mt-0.5 truncate text-[11px] text-gray-500 dark:text-gray-400">
              {{ producto.codigo }}
              <span v-if="producto.codigo_ubicacion"> · {{ producto.codigo_ubicacion }}</span>
              <template v-if="producto.nombre_categoria || producto.marca">
                ·
                <span v-if="producto.nombre_categoria">{{ producto.nombre_categoria }}</span>
                <span v-if="producto.nombre_categoria && producto.marca"> · </span>
                <span v-if="producto.marca">{{ producto.marca }}</span>
              </template>
            </p>
          </button>

          <div class="mt-1.5 flex items-end justify-between gap-2">
            <div class="min-w-0">
              <p class="text-sm font-semibold tabular-nums text-brand-500">
                {{ formatMoney(producto.precio) }}
              </p>
              <p
                v-if="etiquetaStockPos(producto)"
                class="truncate text-[11px] font-medium"
                :class="
                  producto.stock_bajo || Number(producto.stock_actual) <= 0
                    ? 'text-error-500'
                    : 'text-gray-500 dark:text-gray-400'
                "
              >
                {{ etiquetaStockPos(producto) }}
              </p>
              <p
                v-else-if="producto.es_servicio || producto.es_alquilable"
                class="text-[11px] font-medium text-gray-400 dark:text-gray-500"
              >
                No inventariado
              </p>
            </div>

            <div class="flex shrink-0 items-center gap-1">
              <button
                type="button"
                class="inline-flex h-8 w-8 items-center justify-center rounded-lg border transition disabled:cursor-not-allowed disabled:opacity-50"
                :class="
                  productoSinStockParaVenta(producto)
                    ? 'border-gray-300 text-gray-400 dark:border-gray-700 dark:text-gray-500'
                    : 'border-brand-500 bg-brand-500 text-white hover:bg-brand-600'
                "
                :disabled="productoSinStockParaVenta(producto)"
                :title="
                  productoSinStockParaVenta(producto)
                    ? 'Sin stock disponible'
                    : 'Agregar al carrito'
                "
                @click.stop="onAdd(producto)"
              >
                <AppIcon :name="ICONS.plus" :size="16" />
              </button>
              <AppActionMenu
                :items="actionItemsFor(producto)"
                title="Más acciones"
                :execute="(key) => onAction(key, producto)"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="divide-y divide-gray-100 dark:divide-gray-800">
      <div
        v-for="producto in productos"
        :key="producto.id"
        class="flex w-full items-center gap-3 px-4 py-3 transition"
        :class="
          productoSinStockParaVenta(producto)
            ? 'opacity-80'
            : 'hover:bg-gray-50 dark:hover:bg-white/[0.03]'
        "
      >
        <button
          type="button"
          class="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-gray-100 bg-gray-50 dark:border-gray-800 dark:bg-white/5"
          :title="producto.url_imagen_principal ? 'Ver imágenes' : 'Sin imagen'"
          @click="openQuick(producto, 'imagenes')"
        >
          <img
            v-if="producto.url_imagen_principal"
            :src="producto.url_imagen_principal"
            :alt="producto.nombre"
            class="h-full w-full object-contain p-0.5"
            loading="lazy"
          />
          <AppIcon v-else :name="ICONS.package" :size="18" class="text-gray-400" />
        </button>

        <button
          type="button"
          class="min-w-0 flex-1 text-left"
          :disabled="productoSinStockParaVenta(producto)"
          :title="productoSinStockParaVenta(producto) ? 'Sin stock disponible' : 'Agregar al carrito'"
          :class="productoSinStockParaVenta(producto) ? 'cursor-not-allowed' : ''"
          @click="onAdd(producto)"
        >
          <p class="truncate font-medium text-gray-800 dark:text-white/90">{{ producto.nombre }}</p>
          <p class="truncate text-xs text-gray-500 dark:text-gray-400">
            {{ producto.codigo }}
            <span v-if="producto.codigo_ubicacion"> · Ub: {{ producto.codigo_ubicacion }}</span>
            <span v-if="producto.nombre_categoria"> · {{ producto.nombre_categoria }}</span>
            <span v-if="producto.nombre_sub_categoria"> / {{ producto.nombre_sub_categoria }}</span>
            <span v-if="producto.marca"> · {{ producto.marca }}</span>
          </p>
          <p
            v-if="etiquetaStockPos(producto)"
            class="mt-0.5 text-[11px] font-medium"
            :class="
              producto.stock_bajo || Number(producto.stock_actual) <= 0
                ? 'text-error-500'
                : 'text-gray-500 dark:text-gray-400'
            "
          >
            {{ etiquetaStockPos(producto) }}
            <span v-if="productoSinStockParaVenta(producto)"> · Agotado</span>
          </p>
          <p
            v-else-if="producto.es_servicio || producto.es_alquilable"
            class="mt-0.5 text-[11px] font-medium text-gray-400 dark:text-gray-500"
          >
            Servicio · no inventariado
          </p>
        </button>

        <div class="flex shrink-0 items-center gap-1.5">
          <span class="text-sm font-semibold tabular-nums text-brand-500">
            {{ formatMoney(producto.precio) }}
          </span>
          <button
            type="button"
            class="inline-flex h-8 w-8 items-center justify-center rounded-lg border transition disabled:cursor-not-allowed disabled:opacity-50"
            :class="
              productoSinStockParaVenta(producto)
                ? 'border-gray-300 text-gray-400 dark:border-gray-700 dark:text-gray-500'
                : 'border-brand-500 bg-brand-500 text-white hover:bg-brand-600'
            "
            :disabled="productoSinStockParaVenta(producto)"
            :title="
              productoSinStockParaVenta(producto) ? 'Sin stock disponible' : 'Agregar al carrito'
            "
            @click.stop="onAdd(producto)"
          >
            <AppIcon :name="ICONS.plus" :size="16" />
          </button>
          <AppActionMenu
            :items="actionItemsFor(producto)"
            title="Más acciones"
            :execute="(key) => onAction(key, producto)"
          />
        </div>
      </div>
    </div>

    <PosProductoQuickModal
      v-model="quickOpen"
      :producto="productoActivo"
      :initial-tab="quickTab"
      @add="onAdd"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { Producto } from '@/modules/productos/articulos/interfaces/producto.interface'
import PosProductoQuickModal, {
  type PosProductoQuickTab,
} from '@/modules/ventas/comprobantes/components/PosProductoQuickModal.vue'
import {
  etiquetaStockPos,
  productoSinStockParaVenta,
} from '@/modules/ventas/comprobantes/utils/stockPos'
import { AppActionMenu, AppListToolbar } from '@/shared/components'
import AppIcon from '@/shared/components/AppIcon.vue'
import { toastWarning } from '@/shared/composables/useToast'
import { ICONS } from '@/shared/constants/icons'
import type { ActionMenuItem } from '@/shared/interfaces/action-menu.interface'
import type {
  DynamicFilterFieldDef,
  DynamicFilterValues,
} from '@/shared/interfaces/dynamic-filter.interface'

defineProps<{
  productos: Producto[]
  filterFields: DynamicFilterFieldDef[]
  loading?: boolean
  total?: number | null
}>()

const emit = defineEmits<{
  add: [producto: Producto]
  'filter-change': []
}>()

const search = defineModel<string>('search', { default: '' })
const filters = defineModel<DynamicFilterValues>('filters', { default: () => ({}) })

const vista = ref<'gallery' | 'list'>('gallery')
const quickOpen = ref(false)
const quickTab = ref<PosProductoQuickTab>('ubicacion')
const productoActivo = ref<Producto | null>(null)

function actionItemsFor(_producto: Producto): ActionMenuItem[] {
  return [
    {
      key: 'imagenes',
      label: 'Ver imágenes',
      icon: ICONS.images,
    },
    {
      key: 'ubicacion',
      label: 'Ver ubicación',
      icon: ICONS.mapPin,
    },
  ]
}

function openQuick(producto: Producto, tab: PosProductoQuickTab) {
  productoActivo.value = producto
  quickTab.value = tab
  quickOpen.value = true
}

function onAction(key: string, producto: Producto) {
  if (key === 'imagenes') {
    openQuick(producto, 'imagenes')
    return
  }
  if (key === 'ubicacion') {
    openQuick(producto, 'ubicacion')
  }
}

function onAdd(producto: Producto) {
  if (productoSinStockParaVenta(producto)) {
    toastWarning(`${producto.nombre} no tiene stock disponible`)
    return
  }
  emit('add', producto)
}

function formatMoney(value: number) {
  return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(
    Number(value || 0),
  )
}
</script>
