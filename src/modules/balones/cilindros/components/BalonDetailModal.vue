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
        <AppBadge v-if="balon?.nombre_marca_cilindro" color="neutral">
          {{ balon.nombre_marca_cilindro }}
        </AppBadge>
        <AppBadge v-if="balon?.estado_ph" :color="phBadgeColor">
          PH {{ phBadgeLabel }}
        </AppBadge>
      </template>

      <template #extra>
        <DetailSectionCard
          v-if="balon?.baja"
          title="Baja del cilindro"
          :full-width="true"
        >
          <div class="grid gap-3 sm:grid-cols-2">
            <p class="text-sm text-gray-600 dark:text-gray-400">
              <span class="font-medium text-gray-800 dark:text-white/90">Motivo:</span>
              {{ balon.baja.nombre_motivo_baja }}
            </p>
            <p class="text-sm text-gray-600 dark:text-gray-400">
              <span class="font-medium text-gray-800 dark:text-white/90">Fecha:</span>
              {{ formatDetailDate(balon.baja.fecha_baja) }}
            </p>
            <p v-if="balon.baja.nombre_cliente_comprador" class="text-sm text-gray-600 dark:text-gray-400">
              <span class="font-medium text-gray-800 dark:text-white/90">Comprador:</span>
              {{ balon.baja.nombre_cliente_comprador }}
            </p>
            <p
              v-if="balon.baja.serie_comprobante || balon.baja.numero_comprobante"
              class="text-sm text-gray-600 dark:text-gray-400"
            >
              <span class="font-medium text-gray-800 dark:text-white/90">Comprobante:</span>
              {{ [balon.baja.serie_comprobante, balon.baja.numero_comprobante].filter(Boolean).join('-') }}
            </p>
            <p class="text-sm text-gray-600 dark:text-gray-400">
              <span class="font-medium text-gray-800 dark:text-white/90">Autorizó:</span>
              {{ balon.baja.nombre_usuario_autoriza }}
            </p>
            <p v-if="balon.baja.motivo_detalle" class="sm:col-span-2 text-sm text-gray-600 dark:text-gray-400">
              {{ balon.baja.motivo_detalle }}
            </p>
          </div>
        </DetailSectionCard>

        <DetailSectionCard
          v-if="phHistorialRows.length"
          title="Historial de pruebas hidrostáticas"
          :full-width="true"
        >
          <div class="overflow-x-auto">
            <table class="min-w-full text-sm">
              <thead>
                <tr class="border-b border-gray-100 text-left text-theme-xs uppercase text-gray-500 dark:border-gray-800">
                  <th class="pb-2 pr-4">Fecha</th>
                  <th class="pb-2 pr-4">Vigencia</th>
                  <th class="pb-2 pr-4">Próxima</th>
                  <th class="pb-2">Órgano</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="item in phHistorialRows"
                  :key="item.id"
                  class="border-b border-gray-50 dark:border-gray-800/80"
                >
                  <td class="py-2 pr-4 whitespace-nowrap">{{ formatDetailDate(item.fecha_prueba) }}</td>
                  <td class="py-2 pr-4">{{ item.vigencia_anios }} años</td>
                  <td class="py-2 pr-4 whitespace-nowrap">{{ formatDetailDate(item.fecha_proxima) }}</td>
                  <td class="py-2">
                    {{
                      item.organo_inspector_no_aplica
                        ? 'No aplica'
                        : item.nombre_organo_inspector || '—'
                    }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </DetailSectionCard>

        <DetailSectionCard v-if="balon?.observacion" title="Observación" :full-width="true">
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
import {
  useBalonQuery,
  usePhHistorialQuery,
} from '@/modules/balones/cilindros/composables/useBalonesQuery'
import type { BadgeColor } from '@/shared/interfaces/badge.interface'
import { AppBadge, AppModal } from '@/shared/components'

const props = defineProps<{
  balonId?: number | null
}>()

const open = defineModel<boolean>({ default: false })

const balonIdRef = toRef(() => (open.value ? props.balonId : null))
const balonQuery = useBalonQuery(balonIdRef)
const phHistorialQuery = usePhHistorialQuery(balonIdRef)

const isLoading = computed(
  () => balonQuery.isFetching.value || phHistorialQuery.isFetching.value,
)
const balon = computed(() => balonQuery.data.value ?? null)
const phHistorialRows = computed(() => phHistorialQuery.data.value?.data ?? [])

const phBadgeLabel = computed(() => {
  const estado = balon.value?.estado_ph
  if (estado === 'VENCIDA') return 'vencida'
  if (estado === 'POR_VENCER') return 'por vencer'
  return 'vigente'
})

const phBadgeColor = computed((): BadgeColor => {
  const estado = balon.value?.estado_ph
  if (estado === 'VENCIDA') return 'error'
  if (estado === 'POR_VENCER') return 'warning'
  return 'success'
})

const sections = computed<DetailSection[]>(() => {
  const data = balon.value
  if (!data) return []

  return [
    {
      title: 'Identificación',
      items: [
        { label: 'Código', value: data.codigo_balon },
        { label: 'N° serie', value: data.numero_serie },
        { label: 'Marca', value: data.nombre_marca_cilindro },
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
        { label: 'Propietario', value: data.nombre_propietario },
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
        {
          label: 'Órgano inspector',
          value: data.organo_inspector_no_aplica
            ? 'No aplica'
            : data.nombre_organo_inspector,
        },
        { label: 'Presión actual', value: data.presion_actual?.toString() },
        {
          label: 'Fabricación',
          value: data.anio_fabricacion
            ? String(data.anio_fabricacion)
            : formatDetailDate(data.fecha_fabricacion),
        },
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
