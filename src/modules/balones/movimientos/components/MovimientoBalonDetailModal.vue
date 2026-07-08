<template>
  <AppModal
    v-model="open"
    title="Detalle del movimiento"
    :subtitle="movimiento?.codigo_balon ?? undefined"
    size="xl"
  >
    <DetailCardsLayout :loading="isLoading" :sections="sections">
      <template #badges>
        <AppBadge v-if="movimiento?.nombre_tipo_movimiento" color="primary">
          {{ movimiento.nombre_tipo_movimiento }}
        </AppBadge>
      </template>

      <template v-if="movimiento?.observacion" #extra>
        <DetailSectionCard title="Observación" :full-width="true">
          <p class="text-sm text-gray-600 dark:text-gray-400">{{ movimiento.observacion }}</p>
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
import { formatDetailDateTime } from '@/modules/balones/components/detail/detailFormatters'
import type { DetailSection } from '@/modules/balones/components/detail/detail.types'
import { useMovimientoBalonQuery } from '@/modules/balones/movimientos/composables/useMovimientosBalonQuery'
import { AppBadge, AppModal } from '@/shared/components'

const props = defineProps<{ movimientoId?: number | null }>()
const open = defineModel<boolean>({ default: false })

const movimientoIdRef = toRef(() => props.movimientoId)
const movimientoQuery = useMovimientoBalonQuery(movimientoIdRef)

const isLoading = computed(() => movimientoQuery.isFetching.value)
const movimiento = computed(() => movimientoQuery.data.value ?? null)

const sections = computed<DetailSection[]>(() => {
  const data = movimiento.value
  if (!data) return []

  return [
    {
      title: 'Movimiento',
      items: [
        { label: 'Cilindro', value: data.codigo_balon },
        { label: 'Tipo', value: data.nombre_tipo_movimiento },
        { label: 'Fecha', value: formatDetailDateTime(data.fecha_movimiento) },
        { label: 'Cliente', value: data.nombre_cliente },
      ],
    },
    {
      title: 'Documento referencia',
      items: [
        { label: 'Tipo documento', value: data.nombre_tipo_documento_ref },
        { label: 'ID documento', value: data.id_documento_ref?.toString() },
      ],
    },
    {
      title: 'Traslado',
      items: [
        { label: 'Almacén origen', value: data.nombre_almacen_origen },
        { label: 'Almacén destino', value: data.nombre_almacen_destino },
      ],
    },
    {
      title: 'Auditoría',
      items: [
        { label: 'Creado por', value: data.nombre_usuario_creacion },
        { label: 'Modificado por', value: data.nombre_usuario_modificacion },
        { label: 'Fecha creación', value: formatDetailDateTime(data.fecha_creacion) },
        { label: 'Última modificación', value: formatDetailDateTime(data.fecha_modificacion) },
      ],
    },
  ]
})
</script>
