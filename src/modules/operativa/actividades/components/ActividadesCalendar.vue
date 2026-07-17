<template>
  <div class="actividades-calendar">
    <FullCalendar ref="calendarRef" :options="calendarOptions" />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import FullCalendar from '@fullcalendar/vue3'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import listPlugin from '@fullcalendar/list'
import interactionPlugin from '@fullcalendar/interaction'
import esLocale from '@fullcalendar/core/locales/es'
import type { DateClickArg } from '@fullcalendar/interaction'
import type { DatesSetArg, EventClickArg, EventInput } from '@fullcalendar/core'
import type { Actividad } from '@/modules/operativa/actividades/interfaces/actividad.interface'

interface ActividadesCalendarProps {
  actividades: Actividad[]
  loading?: boolean
  /** Vista inicial: dayGridMonth | timeGridWeek | timeGridDay | listWeek */
  initialView?: string
}

const props = withDefaults(defineProps<ActividadesCalendarProps>(), {
  loading: false,
  initialView: 'dayGridMonth',
})

const emit = defineEmits<{
  /** El usuario hizo clic en un día vacío del calendario (crear actividad). */
  'select-date': [fecha: string]
  /** El usuario hizo clic en una actividad existente (ver/editar). */
  'select-actividad': [actividad: Actividad]
  /** Cambió el rango visible (navegación de mes/semana), útil para refetch por rango. */
  'range-change': [range: { fechaDesde: string; fechaHasta: string }]
}>()

const calendarRef = ref<InstanceType<typeof FullCalendar>>()

// Paleta estable por id_estado_actividad. Los nombres/colores "reales" del
// estado vienen del catálogo (gen_lista), aquí solo se asigna un color
// determinista para diferenciarlos visualmente en el calendario.
const ESTADO_COLORS = ['#1565c0', '#0b9444', '#e53935', '#f59e0b', '#7c3aed', '#0891b2', '#be185d']

const colorForEstado = (idEstado: number) => ESTADO_COLORS[idEstado % ESTADO_COLORS.length]

const toIsoDateTime = (fecha: string, hora?: string | null) => {
  const datePart = fecha.slice(0, 10)
  const timePart = (hora ?? '00:00:00').slice(0, 8)
  return `${datePart}T${timePart}`
}

const events = computed<EventInput[]>(() =>
  props.actividades.map((actividad) => {
    const color = colorForEstado(actividad.id_estado_actividad)

    return {
      id: String(actividad.id),
      title: actividad.titulo,
      start: toIsoDateTime(actividad.fecha_programada, actividad.hora_inicio_estimada),
      end: toIsoDateTime(actividad.fecha_programada, actividad.hora_fin_estimada),
      backgroundColor: color,
      borderColor: color,
      extendedProps: { actividad },
    }
  }),
)

const calendarOptions = computed(() => ({
  plugins: [dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin],
  initialView: props.initialView,
  locale: esLocale,
  height: 'auto',
  firstDay: 1,
  headerToolbar: {
    left: 'prev,next today',
    center: 'title',
    right: 'dayGridMonth,timeGridWeek,listWeek',
  },
  buttonText: {
    today: 'Hoy',
    month: 'Mes',
    week: 'Semana',
    list: 'Agenda',
  },
  events: events.value,
  editable: false,
  selectable: true,
  dayMaxEvents: 3,
  nowIndicator: true,
  eventClick: (info: EventClickArg) => {
    const actividad = info.event.extendedProps.actividad as Actividad
    emit('select-actividad', actividad)
  },
  dateClick: (info: DateClickArg) => {
    emit('select-date', info.dateStr.slice(0, 10))
  },
  datesSet: (info: DatesSetArg) => {
    emit('range-change', {
      fechaDesde: info.startStr.slice(0, 10),
      fechaHasta: info.endStr.slice(0, 10),
    })
  },
}))

defineExpose({ calendarRef })
</script>

<style scoped>
.actividades-calendar {
  --fc-border-color: theme('colors.gray.200');
  --fc-page-bg-color: transparent;
  --fc-neutral-bg-color: theme('colors.gray.50');
  --fc-list-event-hover-bg-color: theme('colors.gray.50');
  --fc-today-bg-color: theme('colors.brand.50');
  --fc-button-bg-color: theme('colors.white');
  --fc-button-border-color: theme('colors.gray.300');
  --fc-button-text-color: theme('colors.gray.700');
  --fc-button-hover-bg-color: theme('colors.gray.50');
  --fc-button-hover-border-color: theme('colors.gray.300');
  --fc-button-active-bg-color: theme('colors.brand.500');
  --fc-button-active-border-color: theme('colors.brand.500');
}

:global(.dark) .actividades-calendar {
  --fc-border-color: theme('colors.gray.800');
  --fc-neutral-bg-color: theme('colors.gray.800');
  --fc-list-event-hover-bg-color: theme('colors.gray.800');
  --fc-today-bg-color: color-mix(in srgb, theme('colors.brand.500') 12%, transparent);
  --fc-button-bg-color: theme('colors.gray.800');
  --fc-button-border-color: theme('colors.gray.700');
  --fc-button-text-color: theme('colors.gray.300');
  --fc-button-hover-bg-color: theme('colors.gray.700');
  --fc-button-hover-border-color: theme('colors.gray.700');
  --fc-page-bg-color: transparent;
}

.actividades-calendar :deep(.fc) {
  font-family: inherit;
}

.actividades-calendar :deep(.fc .fc-toolbar-title) {
  font-size: 1rem;
  font-weight: 600;
}

:global(.dark) .actividades-calendar :deep(.fc-toolbar-title) {
  color: rgba(255, 255, 255, 0.9);
}

:global(.dark) .actividades-calendar :deep(.fc-col-header-cell-cushion),
:global(.dark) .actividades-calendar :deep(.fc-daygrid-day-number),
:global(.dark) .actividades-calendar :deep(.fc-list-day-text),
:global(.dark) .actividades-calendar :deep(.fc-list-day-side-text) {
  color: rgba(255, 255, 255, 0.85);
}

.actividades-calendar :deep(.fc-event) {
  cursor: pointer;
  border-radius: 6px;
  font-size: 0.75rem;
  padding: 1px 4px;
}

.actividades-calendar :deep(.fc-daygrid-day):hover {
  background-color: var(--fc-neutral-bg-color);
  cursor: pointer;
}
</style>
