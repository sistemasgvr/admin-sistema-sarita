<template>
  <AppModal
    v-model="open"
    title="Detalle del préstamo"
    :subtitle="prestamo?.numero_prestamo || prestamo?.titulo || undefined"
    size="xl"
  >
    <DetailCardsLayout :loading="isLoading" :sections="sections">
      <template #badges>
        <AppBadge v-if="prestamo?.nombre_tipo_prestamo" color="primary">
          {{ formatListaOpcionLabel(prestamo.nombre_tipo_prestamo) }}
        </AppBadge>
        <AppBadge v-if="prestamo?.nombre_estado" color="neutral">
          {{ formatListaOpcionLabel(prestamo.nombre_estado) }}
        </AppBadge>
        <AppBadge color="neutral">{{ detalleRows.length }} cilindros</AppBadge>
      </template>

      <template #extra>
        <DetailSectionCard
          v-if="detalleRows.length"
          title="Cilindros del préstamo"
          :icon="ICONS.boxes"
          :full-width="true"
        >
          <AppTable bare :columns="detalleColumns" :rows="detalleRows" row-key="id" />
        </DetailSectionCard>

        <DetailSectionCard
          v-if="prestamo?.observacion"
          title="Observación"
          :icon="ICONS.messageSquare"
          :full-width="true"
        >
          <p class="text-sm text-gray-600 dark:text-gray-400">{{ prestamo.observacion }}</p>
        </DetailSectionCard>
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
import { computed, ref, toRef, watch } from 'vue'
import DetailCardsLayout from '@/shared/components/detail/DetailCardsLayout.vue'
import DetailSectionCard from '@/shared/components/detail/DetailSectionCard.vue'
import {
  formatDetailDate,
  formatDetailDateTime,
  formatDetailListaOpcion,
} from '@/shared/components/detail/detailFormatters'
import { formatListaOpcionLabel } from '@/shared/utils/formatListaOpcion'
import type { DetailSection } from '@/shared/components/detail/detail.types'
import { usePrestamoQuery } from '@/modules/balones/prestamos/composables/usePrestamosQuery'
import { usePrestamosDetalleQuery } from '@/modules/balones/prestamos/composables/usePrestamosDetalleQuery'
import type { PrestamoDetalleListFilters } from '@/modules/balones/prestamos/interfaces/prestamo-detalle.interface'
import { AppBadge, AppModal, AppTable } from '@/shared/components'
import { ICONS } from '@/shared/constants/icons'
import type { TableColumn } from '@/shared/interfaces/table.interface'

const props = defineProps<{ prestamoId?: number | null }>()
const open = defineModel<boolean>({ default: false })

const prestamoIdRef = toRef(() => props.prestamoId)
const prestamoQuery = usePrestamoQuery(prestamoIdRef)

const detalleFilters = ref<PrestamoDetalleListFilters>({ pagina: 1, limite: 100 })
const detallesQuery = usePrestamosDetalleQuery(detalleFilters)

const isLoading = computed(() => prestamoQuery.isFetching.value)
const prestamo = computed(() => prestamoQuery.data.value ?? null)
const detalleRows = computed(() => detallesQuery.data.value?.data ?? [])

const detalleColumns: TableColumn[] = [
  { key: 'codigo_balon', label: 'Cilindro' },
  { key: 'nombre_producto', label: 'Gas' },
  { key: 'fecha_prestamo', label: 'Préstamo' },
  { key: 'fecha_vencimiento', label: 'Vencimiento' },
  { key: 'nombre_estado', label: 'Estado' },
]

watch(
  () => [open.value, props.prestamoId] as const,
  ([isOpen, id]) => {
    if (isOpen && id) {
      detalleFilters.value = { idPrestamo: id, pagina: 1, limite: 100 }
    }
  },
  { immediate: true },
)

const sections = computed<DetailSection[]>(() => {
  const data = prestamo.value
  if (!data) return []

  return [
    { title: 'Datos generales', icon: ICONS.clipboardList, items: [
        { label: 'Número', value: data.numero_prestamo },
        { label: 'Título', value: data.titulo },
        { label: 'Tipo', value: formatDetailListaOpcion(data.nombre_tipo_prestamo) },
        { label: 'Estado', value: formatDetailListaOpcion(data.nombre_estado) },
        { label: 'Almacén', value: data.nombre_almacen },
      ],
    },
    { title: 'Partes involucradas', icon: ICONS.users, items: [
        { label: 'Cliente', value: data.nombre_cliente },
        { label: 'Proveedor / tercero', value: data.nombre_proveedor },
      ],
    },
    { title: 'Fechas', icon: ICONS.calendar, items: [
        { label: 'Salida', value: formatDetailDate(data.fecha_salida) },
        { label: 'Retorno pactado', value: formatDetailDate(data.fecha_retorno_pactada) },
        { label: 'Retorno real', value: formatDetailDate(data.fecha_retorno_real) },
      ],
    },
    { title: 'Comprobantes y auditoría', icon: ICONS.creditCard, items: [
        { label: 'Comprobante venta', value: data.id_comprobante_venta?.toString() },
        { label: 'Comprobante compra', value: data.id_comprobante_compra?.toString() },
        { label: 'Fecha creación', value: formatDetailDateTime(data.fecha_creacion) },
        { label: 'Última modificación', value: formatDetailDateTime(data.fecha_modificacion) },
      ],
    },
  ]
})
</script>
