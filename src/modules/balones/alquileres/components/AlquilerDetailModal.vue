<template>
  <AppModal
    v-model="open"
    title="Detalle del alquiler"
    :subtitle="alquiler?.numero_alquiler"
    size="xl"
  >
    <DetailCardsLayout :loading="isLoading" :sections="sections">
      <template #badges>
        <ListaOpcionBadge v-if="alquiler?.nombre_estado" :value="alquiler.nombre_estado" />
        <AppBadge color="neutral">{{ detalleRows.length }} cilindros</AppBadge>
      </template>

      <template #extra>
        <DetailSectionCard
          v-if="detalleRows.length"
          title="Cilindros en alquiler"
          :icon="ICONS.boxes"
          :full-width="true"
        >
          <AppTable bare :columns="detalleColumns" :rows="detalleRows" row-key="id">
            <template #cell-fecha_devolucion="{ row }">
              <span
                v-if="row.fecha_devolucion"
                class="whitespace-nowrap text-success-600 dark:text-success-400"
              >
                {{ String(row.fecha_devolucion).slice(0, 10) }}
              </span>
              <AppBadge v-else size="sm" color="warning">Pendiente</AppBadge>
            </template>
          </AppTable>
        </DetailSectionCard>

        <DetailSectionCard
          v-if="alquiler?.observacion"
          title="Observación"
          :icon="ICONS.messageSquare"
          :full-width="true"
        >
          <p class="text-sm text-gray-600 dark:text-gray-400">{{ alquiler.observacion }}</p>
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
  formatDetailDocument,
  formatDetailListaOpcion,
  formatDetailMoney,
} from '@/shared/components/detail/detailFormatters'
import type { DetailSection } from '@/shared/components/detail/detail.types'
import { useAlquilerQuery } from '@/modules/balones/alquileres/composables/useAlquileresQuery'
import { useAlquileresDetalleQuery } from '@/modules/balones/alquileres/composables/useAlquileresDetalleQuery'
import type { AlquilerDetalleListFilters } from '@/modules/balones/alquileres/interfaces/alquiler-detalle.interface'
import { AppBadge, AppModal, AppTable, ListaOpcionBadge } from '@/shared/components'
import { ICONS } from '@/shared/constants/icons'
import type { TableColumn } from '@/shared/interfaces/table.interface'

const props = defineProps<{ alquilerId?: number | null }>()
const open = defineModel<boolean>({ default: false })

const alquilerIdRef = toRef(() => props.alquilerId)
const alquilerQuery = useAlquilerQuery(alquilerIdRef)

const detalleFilters = ref<AlquilerDetalleListFilters>({ pagina: 1, limite: 100 })
const detallesQuery = useAlquileresDetalleQuery(detalleFilters)

const isLoading = computed(() => alquilerQuery.isFetching.value)
const alquiler = computed(() => alquilerQuery.data.value ?? null)
const detalleRows = computed(() => detallesQuery.data.value?.data ?? [])

const detalleColumns: TableColumn[] = [
  { key: 'codigo_balon', label: 'Cilindro' },
  { key: 'fecha_devolucion', label: 'Devolución' },
]

watch(
  () => [open.value, props.alquilerId] as const,
  ([isOpen, id]) => {
    if (isOpen && id) {
      detalleFilters.value = { idAlquiler: id, pagina: 1, limite: 100 }
    }
  },
  { immediate: true },
)

const sections = computed<DetailSection[]>(() => {
  const data = alquiler.value
  if (!data) return []

  return [
    { title: 'Datos del alquiler', icon: ICONS.clipboardList, items: [
        { label: 'Número', value: data.numero_alquiler },
        { label: 'Cliente', value: data.nombre_cliente },
        { label: 'Almacén', value: data.nombre_almacen },
        { label: 'Estado', value: formatDetailListaOpcion(data.nombre_estado) },
      ],
    },
    { title: 'Vigencia', icon: ICONS.calendar, items: [
        { label: 'Inicio', value: formatDetailDate(data.fecha_inicio) },
        { label: 'Fin pactado', value: formatDetailDate(data.fecha_fin_pactada) },
        { label: 'Fin real', value: formatDetailDate(data.fecha_fin_real) },
      ],
    },
    { title: 'Cobro', icon: ICONS.creditCard, items: [
        { label: 'Tarifa diaria', value: formatDetailMoney(data.tarifa_diaria) },
        { label: 'Total cobrado', value: formatDetailMoney(data.total_cobrado) },
      ],
    },
    { title: 'Comprobante venta', icon: ICONS.fileKey, items: data.id_comprobante_venta
        ? [
            {
              label: 'Número',
              value: formatDetailDocument(data.serie_comprobante_venta, data.numero_comprobante_venta),
            },
            { label: 'Fecha', value: formatDetailDate(data.fecha_comprobante_venta) },
            { label: 'Cliente', value: data.nombre_cliente_comprobante_venta },
            { label: 'Total', value: formatDetailMoney(data.total_comprobante_venta) },
          ]
        : [{ label: 'Comprobante', value: 'Sin comprobante vinculado' }],
    },
    { title: 'Auditoría', icon: ICONS.userCircle, items: [
        { label: 'Fecha creación', value: formatDetailDateTime(data.fecha_creacion) },
        { label: 'Última modificación', value: formatDetailDateTime(data.fecha_modificacion) },
      ],
    },
  ]
})
</script>
