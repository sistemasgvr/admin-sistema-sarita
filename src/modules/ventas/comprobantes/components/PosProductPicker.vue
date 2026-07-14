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
        search-placeholder="Código, nombre o marca..."
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
      class="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-3 2xl:grid-cols-4"
    >
      <button
        v-for="producto in productos"
        :key="producto.id"
        type="button"
        class="group flex flex-col rounded-xl border border-gray-200 bg-white p-3 text-left transition hover:border-brand-400 hover:shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.02] dark:hover:border-brand-500"
        @click="emit('add', producto)"
      >
        <div
          class="mb-3 flex h-20 items-center justify-center rounded-lg bg-gray-50 transition group-hover:bg-brand-50 dark:bg-white/5 dark:group-hover:bg-brand-500/10"
        >
          <AppIcon :name="ICONS.package" :size="28" class="text-gray-400 group-hover:text-brand-500" />
        </div>
        <p class="line-clamp-2 min-h-[2.5rem] text-sm font-medium text-gray-800 dark:text-white/90">
          {{ producto.nombre }}
        </p>
        <p class="mt-1 truncate text-xs text-gray-500 dark:text-gray-400">{{ producto.codigo }}</p>
        <p
          v-if="producto.nombre_categoria || producto.marca"
          class="mt-1 truncate text-xs text-gray-400 dark:text-gray-500"
        >
          <span v-if="producto.nombre_categoria">{{ producto.nombre_categoria }}</span>
          <span v-if="producto.nombre_categoria && producto.marca"> · </span>
          <span v-if="producto.marca">{{ producto.marca }}</span>
        </p>
        <div class="mt-2 flex items-center justify-between gap-2">
          <span class="text-sm font-semibold text-brand-500">{{ formatMoney(producto.precio) }}</span>
          <span
            class="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-brand-500 text-white opacity-0 transition group-hover:opacity-100"
          >
            <AppIcon :name="ICONS.plus" :size="16" />
          </span>
        </div>
      </button>
    </div>

    <div v-else class="divide-y divide-gray-100 dark:divide-gray-800">
      <button
        v-for="producto in productos"
        :key="producto.id"
        type="button"
        class="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-gray-50 dark:hover:bg-white/[0.03]"
        @click="emit('add', producto)"
      >
        <div
          class="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-gray-50 dark:bg-white/5"
        >
          <AppIcon :name="ICONS.package" :size="20" class="text-gray-400" />
        </div>
        <div class="min-w-0 flex-1">
          <p class="truncate font-medium text-gray-800 dark:text-white/90">{{ producto.nombre }}</p>
          <p class="truncate text-xs text-gray-500 dark:text-gray-400">
            {{ producto.codigo }}
            <span v-if="producto.nombre_categoria"> · {{ producto.nombre_categoria }}</span>
            <span v-if="producto.nombre_sub_categoria"> / {{ producto.nombre_sub_categoria }}</span>
            <span v-if="producto.marca"> · {{ producto.marca }}</span>
          </p>
        </div>
        <div class="flex shrink-0 items-center gap-3">
          <span class="text-sm font-semibold tabular-nums text-brand-500">
            {{ formatMoney(producto.precio) }}
          </span>
          <span
            class="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-brand-200 text-brand-500 dark:border-brand-500/30"
          >
            <AppIcon :name="ICONS.plus" :size="16" />
          </span>
        </div>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { Producto } from '@/modules/productos/articulos/interfaces/producto.interface'
import { AppListToolbar } from '@/shared/components'
import AppIcon from '@/shared/components/AppIcon.vue'
import { ICONS } from '@/shared/constants/icons'
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

function formatMoney(value: number) {
  return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(
    Number(value || 0),
  )
}
</script>
