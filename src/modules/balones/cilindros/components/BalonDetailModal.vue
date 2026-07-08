<template>
  <AppModal
    v-model="open"
    title="Detalle del cilindro"
    :subtitle="balon?.codigo_balon"
    size="xl"
  >
    <DetailCardsLayout :loading="isLoading" :sections="sections">
      <template #badges>
        <AppBadge v-if="balon?.nombre_estado_balon" color="primary">
          {{ balon.nombre_estado_balon }}
        </AppBadge>
        <AppBadge v-if="balon?.nombre_tipo_balon" color="neutral">
          {{ balon.nombre_tipo_balon }}
        </AppBadge>
        <AppBadge v-if="balon?.nombre_propietario" color="neutral">
          {{ balon.nombre_propietario }}
        </AppBadge>
      </template>

      <template v-if="balon?.observacion" #extra>
        <DetailSectionCard title="Observación" :full-width="true">
          <p class="text-sm text-gray-600 dark:text-gray-400">{{ balon.observacion }}</p>
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
} from '@/modules/balones/components/detail/detailFormatters'
import type { DetailSection } from '@/modules/balones/components/detail/detail.types'
import { useBalonQuery } from '@/modules/balones/cilindros/composables/useBalonesQuery'
import { AppBadge, AppModal } from '@/shared/components'

const props = defineProps<{
  balonId?: number | null
}>()

const open = defineModel<boolean>({ default: false })

const balonIdRef = toRef(() => props.balonId)
const balonQuery = useBalonQuery(balonIdRef)

const isLoading = computed(() => balonQuery.isFetching.value)
const balon = computed(() => balonQuery.data.value ?? null)

const sections = computed<DetailSection[]>(() => {
  const data = balon.value
  if (!data) return []

  return [
    {
      title: 'Identificación',
      items: [
        { label: 'Código', value: data.codigo_balon },
        { label: 'Libro', value: data.libro_cilindro },
        { label: 'Página', value: data.pagina_libro?.toString() },
        { label: 'Fecha registro', value: formatDetailDate(data.fecha_registro) },
        { label: 'N° recepción', value: data.numero_recepcion },
      ],
    },
    {
      title: 'Clasificación y ubicación',
      items: [
        { label: 'Tipo de balón', value: data.nombre_tipo_balon },
        { label: 'Gas', value: data.nombre_producto_gas },
        { label: 'Referencia', value: data.nombre_referencia },
        { label: 'Almacén', value: data.nombre_almacen },
        { label: 'Cliente ubicación', value: data.nombre_cliente_ubicacion },
        { label: 'Cliente propietario', value: data.nombre_cliente_propietario },
      ],
    },
    {
      title: 'Prueba hidrostática',
      items: [
        { label: 'Última P.H.', value: formatDetailDate(data.fecha_ultima_prueba_hidrostatica) },
        {
          label: 'Vigencia',
          value: data.vigencia_prueba_hidrostatica_anios
            ? `${data.vigencia_prueba_hidrostatica_anios} años`
            : undefined,
        },
        { label: 'Próxima P.H.', value: formatDetailDate(data.fecha_proxima_prueba_hidrostatica) },
        { label: 'Presión actual', value: data.presion_actual?.toString() },
        { label: 'Fecha fabricación', value: formatDetailDate(data.fecha_fabricacion) },
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
