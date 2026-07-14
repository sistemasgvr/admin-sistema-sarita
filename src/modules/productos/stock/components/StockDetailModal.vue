<template>
  <AppModal
    v-model="open"
    title="Detalle de stock"
    :subtitle="stock?.nombre_producto"
    size="lg"
  >
    <DetailCardsLayout :loading="false" :sections="sections">
      <template #badges>
        <AppBadge v-if="stock?.bajo_minimo" color="error">Bajo mínimo</AppBadge>
        <AppBadge v-else color="success">OK</AppBadge>
      </template>
    </DetailCardsLayout>

    <template #footer>
      <button
        type="button"
        class="flex w-full justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-white/[0.03] sm:w-auto"
        @click="open = false"
      >
        Cerrar
      </button>
    </template>
  </AppModal>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import DetailCardsLayout from '@/shared/components/detail/DetailCardsLayout.vue'
import {
  formatDetailCantidad,
  formatDetailDateTime,
} from '@/shared/components/detail/detailFormatters'
import type { DetailSection } from '@/shared/components/detail/detail.types'
import type { Stock } from '@/modules/productos/stock/interfaces/stock.interface'
import { AppBadge, AppModal } from '@/shared/components'
import { ICONS } from '@/shared/constants/icons'

const props = defineProps<{
  stock?: Stock | null
}>()

const open = defineModel<boolean>({ default: false })

const sections = computed<DetailSection[]>(() => {
  const data = props.stock
  if (!data) return []

  return [
    {
      title: 'Ubicación',
      icon: ICONS.warehouse,
      items: [
        { label: 'Almacén', value: data.nombre_almacen },
        { label: 'Sucursal', value: data.nombre_sucursal },
      ],
    },
    {
      title: 'Producto',
      icon: ICONS.package,
      items: [
        { label: 'Producto', value: data.nombre_producto },
        { label: 'Código', value: data.codigo_producto },
        { label: 'Unidad de medida', value: data.nombre_unidad_medida },
      ],
    },
    {
      title: 'Inventario',
      icon: ICONS.boxes,
      items: [
        { label: 'Stock actual', value: formatDetailCantidad(data.stock) },
        { label: 'Stock mínimo', value: formatDetailCantidad(data.stock_minimo) },
      ],
    },
    {
      title: 'Auditoría',
      icon: ICONS.userCircle,
      items: [
        { label: 'Fecha creación', value: formatDetailDateTime(data.fecha_creacion) },
        { label: 'Última modificación', value: formatDetailDateTime(data.fecha_modificacion) },
      ],
    },
  ]
})
</script>
