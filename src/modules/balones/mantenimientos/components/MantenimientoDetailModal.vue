<template>
  <AppModal
    v-model="open"
    title="Detalle del mantenimiento"
    :subtitle="mantenimiento?.codigo_balon ?? undefined"
    size="xl"
  >
    <DetailCardsLayout :loading="isLoading" :sections="sections">
      <template #badges>
        <AppBadge v-if="mantenimiento?.nombre_tipo_mantenimiento" color="primary">
          {{ mantenimiento.nombre_tipo_mantenimiento }}
        </AppBadge>
        <AppBadge v-if="mantenimiento?.nombre_estado" color="neutral">
          {{ mantenimiento.nombre_estado }}
        </AppBadge>
        <AppBadge
          :color="mantenimiento?.es_externo ? 'warning' : undefined"
          :variant="mantenimiento?.es_externo ? undefined : 'light'"
        >
          {{ mantenimiento?.es_externo ? 'Externo' : 'Interno' }}
        </AppBadge>
      </template>

      <template #extra>
        <DetailSectionCard v-if="mantenimiento?.descripcion" title="Descripción" :full-width="true">
          <p class="text-sm text-gray-600 dark:text-gray-400">{{ mantenimiento.descripcion }}</p>
        </DetailSectionCard>

        <DetailSectionCard v-if="mantenimiento?.observacion" title="Observación" :full-width="true">
          <p class="text-sm text-gray-600 dark:text-gray-400">{{ mantenimiento.observacion }}</p>
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
import DetailCardsLayout from '@/modules/balones/components/detail/DetailCardsLayout.vue'
import DetailSectionCard from '@/modules/balones/components/detail/DetailSectionCard.vue'
import {
  formatDetailDate,
  formatDetailDateTime,
  formatDetailMoney,
  formatDetailYesNo,
} from '@/modules/balones/components/detail/detailFormatters'
import type { DetailSection } from '@/modules/balones/components/detail/detail.types'
import { useMantenimientoQuery } from '@/modules/balones/mantenimientos/composables/useMantenimientosQuery'
import { AppBadge, AppModal } from '@/shared/components'

const props = defineProps<{ mantenimientoId?: number | null }>()
const open = defineModel<boolean>({ default: false })

const mantenimientoIdRef = toRef(() => props.mantenimientoId)
const mantenimientoQuery = useMantenimientoQuery(mantenimientoIdRef)

const isLoading = computed(() => mantenimientoQuery.isFetching.value)
const mantenimiento = computed(() => mantenimientoQuery.data.value ?? null)

const sections = computed<DetailSection[]>(() => {
  const data = mantenimiento.value
  if (!data) return []

  return [
    {
      title: 'Servicio',
      items: [
        { label: 'Cilindro', value: data.codigo_balon },
        { label: 'Tipo', value: data.nombre_tipo_mantenimiento },
        { label: 'Estado', value: data.nombre_estado },
        { label: 'Origen', value: formatDetailYesNo(data.es_externo, 'Externo', 'Interno') },
        { label: 'Costo', value: formatDetailMoney(data.costo) },
      ],
    },
    {
      title: 'Fechas',
      items: [
        { label: 'Ingreso', value: formatDetailDate(data.fecha_ingreso) },
        { label: 'Salida', value: formatDetailDate(data.fecha_salida) },
      ],
    },
    {
      title: 'Proveedor externo',
      items: [
        { label: 'Proveedor / taller', value: data.nombre_proveedor },
      ],
    },
    {
      title: 'Comprobantes y auditoría',
      items: [
        { label: 'Comprobante venta', value: data.id_comprobante_venta?.toString() },
        { label: 'Comprobante compra', value: data.id_comprobante_compra?.toString() },
        { label: 'Fecha creación', value: formatDetailDateTime(data.fecha_creacion) },
        { label: 'Última modificación', value: formatDetailDateTime(data.fecha_modificacion) },
      ],
    },
  ]
})
</script>
