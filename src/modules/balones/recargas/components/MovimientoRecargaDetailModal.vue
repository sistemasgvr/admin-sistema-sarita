<template>
  <AppModal
    v-model="open"
    title="Detalle de la recarga"
    :subtitle="recarga?.codigo_balon ?? undefined"
    size="xl"
  >
    <DetailCardsLayout :loading="isLoading" :sections="sections">
      <template #badges>
        <AppBadge v-if="recarga?.nombre_producto" color="primary">
          {{ recarga.nombre_producto }}
        </AppBadge>
        <AppBadge v-if="recarga?.nombre_almacen" color="neutral">
          {{ recarga.nombre_almacen }}
        </AppBadge>
      </template>

      <template v-if="recarga?.observacion" #extra>
        <DetailSectionCard title="Observación" :icon="ICONS.messageSquare" :full-width="true">
          <p class="text-sm text-gray-600 dark:text-gray-400">{{ recarga.observacion }}</p>
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
import { computed, toRef } from 'vue'
import DetailCardsLayout from '@/shared/components/detail/DetailCardsLayout.vue'
import DetailSectionCard from '@/shared/components/detail/DetailSectionCard.vue'
import {
  formatDetailCapacity,
  formatDetailDate,
  formatDetailDateTime,
  formatDetailDocument,
} from '@/shared/components/detail/detailFormatters'
import type { DetailSection } from '@/shared/components/detail/detail.types'
import { useMovimientoRecargaQuery } from '@/modules/balones/recargas/composables/useMovimientosRecargaQuery'
import { AppBadge, AppModal } from '@/shared/components'
import { ICONS } from '@/shared/constants/icons'

const props = defineProps<{ recargaId?: number | null }>()
const open = defineModel<boolean>({ default: false })

const recargaIdRef = toRef(() => props.recargaId)
const recargaQuery = useMovimientoRecargaQuery(recargaIdRef)

const isLoading = computed(() => recargaQuery.isFetching.value)
const recarga = computed(() => recargaQuery.data.value ?? null)

const sections = computed<DetailSection[]>(() => {
  const data = recarga.value
  if (!data) return []

  return [
    { title: 'Salida de almacén', icon: ICONS.warehouse, items: [
        { label: 'Cilindro', value: data.codigo_balon },
        { label: 'Fecha salida', value: formatDetailDate(data.fecha_salida_almacen) },
        { label: 'Almacén', value: data.nombre_almacen },
        { label: 'Gas', value: data.nombre_producto },
        {
          label: 'Capacidad',
          value: formatDetailCapacity(data.capacidad, data.nombre_unidad_medida),
        },
        { label: 'Proveedor', value: data.nombre_proveedor },
      ],
    },
    { title: 'Guías de remisión', icon: ICONS.clipboardList, items: [
        {
          label: 'GRE salida',
          value: formatDetailDocument(data.serie_guia_salida, data.numero_guia_salida),
        },
        {
          label: 'GRE ingreso',
          value: formatDetailDocument(data.serie_guia_ingreso, data.numero_guia_ingreso),
        },
      ],
    },
    { title: 'Factura y retorno', icon: ICONS.creditCard, items: [
        {
          label: 'Factura',
          value: formatDetailDocument(data.serie_factura, data.numero_factura),
        },
        { label: 'ID comprobante', value: data.id_comprobante?.toString() },
        { label: 'Fecha llegada', value: formatDetailDate(data.fecha_llegada_almacen) },
        { label: 'Lote', value: data.lote },
        { label: 'Vencimiento lote', value: formatDetailDate(data.fecha_vencimiento_lote) },
        { label: 'P.H. recarga', value: formatDetailDate(data.fecha_prueba_hidrostatica) },
      ],
    },
    { title: 'Auditoría', icon: ICONS.userCircle, items: [
        { label: 'Fecha creación', value: formatDetailDateTime(data.fecha_creacion) },
        { label: 'Última modificación', value: formatDetailDateTime(data.fecha_modificacion) },
      ],
    },
  ]
})
</script>
