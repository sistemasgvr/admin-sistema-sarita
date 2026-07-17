<template>
  <AppModal
    v-model="open"
    title="Detalle de la actividad"
    :subtitle="actividad?.titulo"
    size="lg"
  >
    <div v-if="actividad" class="space-y-4">
      <div class="flex flex-wrap items-center gap-2">
        <AppBadge v-if="actividad.nombre_estado_actividad" color="primary">
          {{ actividad.nombre_estado_actividad }}
        </AppBadge>
        <AppBadge v-if="actividad.nombre_prioridad" color="warning">
          {{ actividad.nombre_prioridad }}
        </AppBadge>
        <AppBadge v-if="actividad.nombre_tipo_actividad" color="neutral">
          {{ actividad.nombre_tipo_actividad }}
        </AppBadge>
      </div>

      <section
        v-for="section in sections"
        :key="section.title"
        class="rounded-xl border border-gray-200 bg-white p-4 shadow-theme-xs dark:border-gray-800 dark:bg-gray-900/40"
      >
        <h5 class="mb-3 text-sm font-semibold text-gray-800 dark:text-white/90">
          {{ section.title }}
        </h5>

        <dl class="grid gap-x-4 gap-y-3 sm:grid-cols-2">
          <div
            v-for="item in section.items"
            :key="item.label"
            :class="item.fullWidth ? 'sm:col-span-2' : ''"
          >
            <dt class="text-theme-xs text-gray-500 dark:text-gray-400">{{ item.label }}</dt>
            <dd class="text-sm font-medium text-gray-800 dark:text-white/90">
              {{ item.value ?? '—' }}
            </dd>
          </div>
        </dl>
      </section>
    </div>

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
import { AppBadge, AppModal } from '@/shared/components'
import { formatDateTime, formatListDate } from '@/shared/utils/date'

interface ActividadDetailModalProps {
  actividad?: Actividad | null
}

const props = defineProps<ActividadDetailModalProps>()

const open = defineModel<boolean>({ default: false })

const idReferencia = computed(() => props.actividad?.id)
const actividadDetailQuery = useActividadDetailQuery(idReferencia, open)
const actividad = computed<Actividad | null>(
  () => actividadDetailQuery.data.value ?? props.actividad ?? null,
)

const formatHora = (value?: string | null) => (value ? value.slice(0, 5) : null)

interface DetailItem {
  label: string
  value: string | null
  fullWidth?: boolean
}

interface DetailSection {
  title: string
  items: DetailItem[]
}

const sections = computed<DetailSection[]>(() => {
  const a = actividad.value
  if (!a) return []

  return [
    {
      title: 'Datos generales',
      items: [
        { label: 'Título', value: a.titulo, fullWidth: true },
        { label: 'Descripción', value: a.descripcion ?? null, fullWidth: true },
        { label: 'Cliente', value: a.razon_social_cliente ?? 'Sin cliente asignado' },
        {
          label: 'Usuario responsable',
          value: a.nombre_usuario_responsable ?? 'Sin responsable asignado',
        },
      ],
    },
    {
      title: 'Programación',
      items: [
        { label: 'Fecha programada', value: formatListDate(a.fecha_programada) },
        { label: 'Hora de inicio', value: formatHora(a.hora_inicio_estimada) },
        { label: 'Hora de fin', value: formatHora(a.hora_fin_estimada) },
        { label: 'Fecha y hora de cierre', value: formatDateTime(a.fecha_hora_cierre) },
      ],
    },
    {
      title: 'Clasificación',
      items: [
        { label: 'Tipo de actividad', value: a.nombre_tipo_actividad ?? null },
        { label: 'Prioridad', value: a.nombre_prioridad ?? null },
        { label: 'Estado', value: a.nombre_estado_actividad ?? null },
        { label: 'Observaciones', value: a.observaciones ?? null, fullWidth: true },
      ],
    },
    {
      title: 'Auditoría',
      items: [
        { label: 'Creado por', value: a.nombre_usuario_creacion ?? null },
        { label: 'Fecha de creación', value: formatDateTime(a.fecha_creacion) },
        { label: 'Modificado por', value: a.nombre_usuario_modificacion ?? null },
        { label: 'Última modificación', value: formatDateTime(a.fecha_modificacion) },
      ],
    },
  ]
})
</script>
