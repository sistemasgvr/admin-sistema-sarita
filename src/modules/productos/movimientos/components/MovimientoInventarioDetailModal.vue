<template>
  <AppModal
    v-model="open"
    title="Detalle del movimiento"
    :subtitle="movimiento?.nombre_tipo_movimiento"
    size="lg"
  >
    <DetailCardsLayout :loading="false" :sections="sections">
      <template #badges>
        <AppBadge
          v-if="movimiento?.nombre_tipo_movimiento"
          :color="
            movimiento.nombre_tipo_movimiento.toUpperCase().includes('SALIDA')
              ? 'error'
              : 'success'
          "
        >
          {{ movimiento.nombre_tipo_movimiento }}
        </AppBadge>
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
  formatDetailDate,
  formatDetailDateTime,
} from '@/shared/components/detail/detailFormatters'
import type { DetailSection } from '@/shared/components/detail/detail.types'
import type { MovimientoInventario } from '@/modules/productos/movimientos/interfaces/movimiento-inventario.interface'
import { AppBadge, AppModal } from '@/shared/components'
import { ICONS } from '@/shared/constants/icons'

const props = defineProps<{
  movimiento?: MovimientoInventario | null
}>()

const open = defineModel<boolean>({ default: false })

const sections = computed<DetailSection[]>(() => {
  const data = props.movimiento
  if (!data) return []

  const stockCambio =
    data.stock_anterior != null && data.stock_nuevo != null
      ? `${formatDetailCantidad(data.stock_anterior)} → ${formatDetailCantidad(data.stock_nuevo)}`
      : undefined

  return [
    {
      title: 'Movimiento',
      icon: ICONS.arrowLeftRight,
      items: [
        { label: 'Fecha', value: formatDetailDate(data.fecha) },
        { label: 'Tipo', value: data.nombre_tipo_movimiento },
        { label: 'Cantidad', value: formatDetailCantidad(data.cantidad) },
        { label: 'Stock anterior / nuevo', value: stockCambio },
      ],
    },
    {
      title: 'Producto y almacén',
      icon: ICONS.package,
      items: [
        { label: 'Producto', value: data.nombre_producto },
        { label: 'Código', value: data.codigo_producto },
        { label: 'Almacén', value: data.nombre_almacen },
      ],
    },
    {
      title: 'Referencia',
      icon: ICONS.clipboardList,
      items: [
        { label: 'Tipo documento', value: data.nombre_tipo_documento_ref },
        { label: 'ID documento', value: data.id_documento_ref?.toString() },
        { label: 'Glosa', value: data.glosa },
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
