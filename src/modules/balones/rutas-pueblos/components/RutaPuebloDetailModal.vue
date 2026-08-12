<template>
  <AppModal
    v-model="open"
    title="Detalle de ruta pueblos"
    :subtitle="subtitle"
    size="xl"
  >
    <DetailCardsLayout :loading="isLoading" :sections="sections">
      <template #badges>
        <ListaOpcionBadge v-if="ruta?.nombre_estado" :value="ruta.nombre_estado" />
        <AppBadge color="neutral">
          {{ ruta?.total_retornados ?? retornadosCount }}/{{ ruta?.total_cilindros ?? detalleRows.length }}
          cilindros
        </AppBadge>
      </template>

      <template #extra>
        <DetailSectionCard
          v-if="detalleRows.length"
          title="Cilindros de la ruta"
          :icon="ICONS.boxes"
          :full-width="true"
        >
          <AppTable bare :columns="detalleColumns" :rows="detalleRows" row-key="id">
            <template #cell-lb_salida="{ value }">
              <span class="tabular-nums">{{ formatLb(value) }}</span>
            </template>
            <template #cell-lb_retorno="{ value }">
              <span class="tabular-nums">{{ value != null && value !== '' ? formatLb(value) : '—' }}</span>
            </template>
            <template #cell-m3_delta="{ value }">
              <span class="tabular-nums">{{ value != null && value !== '' ? formatM3(value) : '—' }}</span>
            </template>
            <template #cell-estado_cil="{ row }">
              <ListaOpcionBadge
                :value="row.lb_retorno != null ? 'RETORNADO' : 'PENDIENTE'"
                :descripcion="row.lb_retorno != null ? 'Retornado' : 'Pendiente'"
              />
            </template>
          </AppTable>
        </DetailSectionCard>

        <DetailSectionCard
          v-if="ruta?.observacion"
          title="Observación"
          :icon="ICONS.messageSquare"
          :full-width="true"
        >
          <p class="text-sm text-gray-600 dark:text-gray-400">{{ ruta.observacion }}</p>
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
  formatDetailCantidad,
  formatDetailDate,
  formatDetailListaOpcion,
} from '@/shared/components/detail/detailFormatters'
import type { DetailSection } from '@/shared/components/detail/detail.types'
import { useRutaPuebloQuery } from '@/modules/balones/rutas-pueblos/composables/useRutasPueblosQuery'
import { AppBadge, AppModal, AppTable, ListaOpcionBadge } from '@/shared/components'
import { ICONS } from '@/shared/constants/icons'
import type { TableColumn } from '@/shared/interfaces/table.interface'

const props = defineProps<{ rutaId?: number | null }>()
const open = defineModel<boolean>({ default: false })

const rutaIdRef = toRef(() => (open.value ? props.rutaId ?? null : null))
const rutaQuery = useRutaPuebloQuery(rutaIdRef)

const isLoading = computed(() => rutaQuery.isFetching.value)
const ruta = computed(() => rutaQuery.data.value ?? null)

const subtitle = computed(() => {
  if (!ruta.value) return undefined
  const fecha = ruta.value.fecha?.slice(0, 10)
  const almacen = ruta.value.nombre_almacen
  return [fecha, almacen].filter(Boolean).join(' · ') || undefined
})

const detalleRows = computed(() => ruta.value?.detalles ?? [])
const retornadosCount = computed(
  () => detalleRows.value.filter((d) => d.lb_retorno != null).length,
)

function formatLb(value: unknown) {
  const n = Number(value)
  return Number.isFinite(n) ? `${n.toFixed(2)} lb` : '—'
}

function formatM3(value: unknown) {
  const n = Number(value)
  return Number.isFinite(n) ? `${n.toFixed(3)} m³` : '—'
}

const detalleColumns: TableColumn[] = [
  { key: 'codigo_balon', label: 'Código' },
  { key: 'nombre_tipo_balon', label: 'Tipo' },
  { key: 'lb_salida', label: 'Lb salida', align: 'right' },
  { key: 'lb_retorno', label: 'Lb retorno', align: 'right' },
  { key: 'm3_delta', label: 'm³ usados', align: 'right' },
  { key: 'estado_cil', label: 'Estado' },
]

const sections = computed<DetailSection[]>(() => {
  const r = ruta.value
  if (!r) return []
  return [
    {
      title: 'Datos de la ruta',
      icon: ICONS.mapPin,
      items: [
        { label: 'Fecha', value: formatDetailDate(r.fecha) },
        { label: 'Estado', value: formatDetailListaOpcion(r.nombre_estado) },
        { label: 'Almacén', value: r.nombre_almacen || '—' },
        { label: 'Chofer', value: r.nombre_chofer || '—' },
        {
          label: 'Responsable',
          value: r.nombre_usuario_responsable || '—',
        },
        {
          label: 'Factor lb → m³',
          value: formatDetailCantidad(Number(r.factor_lb_m3)),
        },
        {
          label: 'Tolerancia',
          value: `${formatDetailCantidad(Number(r.tolerancia_m3))} m³`,
        },
      ],
    },
    {
      title: 'Gas / cierre',
      icon: ICONS.clipboardCheck,
      items: [
        {
          label: 'm³ calculado',
          value: `${formatDetailCantidad(Number(r.m3_calculado ?? 0))} m³`,
        },
        {
          label: 'm³ reportado',
          value:
            r.m3_reportado_ventas != null
              ? `${formatDetailCantidad(Number(r.m3_reportado_ventas))} m³`
              : '—',
        },
        {
          label: 'Descuadre',
          value:
            r.descuadre_m3 != null
              ? `${formatDetailCantidad(Number(r.descuadre_m3))} m³`
              : '—',
        },
        {
          label: 'Cilindros',
          value: `${r.total_retornados ?? retornadosCount.value} retornados / ${r.total_cilindros ?? detalleRows.value.length}`,
        },
      ],
    },
  ]
})
</script>
