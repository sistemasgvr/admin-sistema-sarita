<template>
  <AppModal
    v-model="open"
    title="Detalle de la actividad"
    :subtitle="actividad?.titulo"
    size="lg"
  >
    <DetailCardsLayout :loading="isLoading" :sections="sections">
      <template #badges>
        <ListaOpcionBadge
          v-if="actividad?.nombre_estado_actividad"
          :value="actividad.nombre_estado_actividad"
        />
        <ListaOpcionBadge
          v-if="actividad?.nombre_prioridad"
          :value="actividad.nombre_prioridad"
        />
        <ListaOpcionBadge
          v-if="actividad?.nombre_tipo_actividad"
          :value="actividad.nombre_tipo_actividad"
        />
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
import type { Actividad } from '@/modules/operativa/actividades/interfaces/actividad.interface'
import { useActividadDetailQuery } from '@/modules/operativa/actividades/composables/useActividadDetailQuery'
import { AppModal, ListaOpcionBadge } from '@/shared/components'
import DetailCardsLayout from '@/shared/components/detail/DetailCardsLayout.vue'
import {
  formatDetailDateTime,
  formatDetailListaOpcion,
} from '@/shared/components/detail/detailFormatters'
import type { DetailSection } from '@/shared/components/detail/detail.types'
import { ICONS } from '@/shared/constants/icons'
import { formatListDate } from '@/shared/utils/date'

interface ActividadDetailModalProps {
  actividad?: Actividad | null
}

const props = defineProps<ActividadDetailModalProps>()

const open = defineModel<boolean>({ default: false })

const idReferencia = computed(() => props.actividad?.id)
const actividadDetailQuery = useActividadDetailQuery(idReferencia, open)
const isLoading = computed(() => actividadDetailQuery.isFetching.value)
const actividad = computed<Actividad | null>(
  () => actividadDetailQuery.data.value ?? props.actividad ?? null,
)

const formatHora = (value?: string | null) => (value ? value.slice(0, 5) : undefined)

const sections = computed<DetailSection[]>(() => {
  const a = actividad.value
  if (!a) return []

  return [
    {
      title: 'Datos generales',
      icon: ICONS.clipboardList,
      items: [
        { label: 'Título', value: a.titulo, fullWidth: true },
        { label: 'Descripción', value: a.descripcion, fullWidth: true },
        { label: 'Cliente', value: a.razon_social_cliente ?? 'Sin cliente asignado' },
        {
          label: 'Usuario responsable',
          value: a.nombre_usuario_responsable ?? 'Sin responsable asignado',
        },
      ],
    },
    {
      title: 'Programación',
      icon: ICONS.calendar,
      items: [
        { label: 'Fecha programada', value: formatListDate(a.fecha_programada) },
        { label: 'Hora de inicio', value: formatHora(a.hora_inicio_estimada) },
        { label: 'Hora de fin', value: formatHora(a.hora_fin_estimada) },
        { label: 'Fecha y hora de cierre', value: formatDetailDateTime(a.fecha_hora_cierre) },
      ],
    },
    {
      title: 'Clasificación',
      icon: ICONS.tags,
      items: [
        {
          label: 'Tipo de actividad',
          value: formatDetailListaOpcion(a.nombre_tipo_actividad),
        },
        { label: 'Prioridad', value: formatDetailListaOpcion(a.nombre_prioridad) },
        { label: 'Estado', value: formatDetailListaOpcion(a.nombre_estado_actividad) },
        { label: 'Observaciones', value: a.observaciones, fullWidth: true },
      ],
    },
    {
      title: 'Auditoría',
      icon: ICONS.userCircle,
      items: [
        { label: 'Creado por', value: a.nombre_usuario_creacion },
        { label: 'Fecha de creación', value: formatDetailDateTime(a.fecha_creacion) },
        { label: 'Modificado por', value: a.nombre_usuario_modificacion },
        { label: 'Última modificación', value: formatDetailDateTime(a.fecha_modificacion) },
      ],
    },
  ]
})
</script>
