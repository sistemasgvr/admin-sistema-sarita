<template>
  <div class="rounded-xl border border-gray-200 bg-white p-4 shadow-theme-xs dark:border-gray-800 dark:bg-gray-900/40">
    <div class="actividades-calendar">
      <FullCalendar ref="calendarRef" :options="calendarOptions" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
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
}

const props = withDefaults(defineProps<ActividadesCalendarProps>(), {
  loading: false,
})

const isMobile = ref(false)

const checkMobile = () => {
  isMobile.value = window.innerWidth < 768
}

onMounted(() => {
  checkMobile()
  window.addEventListener('resize', checkMobile)
})

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
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

const COLORS = [
  { bg: '#2563eb', border: '#1d4ed8' },
  { bg: '#e11d48', border: '#be123c' },
  { bg: '#65a30d', border: '#4d7c0f' },
  { bg: '#d97706', border: '#b45309' },
  { bg: '#0891b2', border: '#0e7490' },
  { bg: '#7c3aed', border: '#6d28d9' },
  { bg: '#be185d', border: '#9d174d' },
  { bg: '#0d9488', border: '#0f766e' },
  { bg: '#ea580c', border: '#c2410c' },
  { bg: '#4f46e5', border: '#4338ca' },
]

const colorFor = (id: number) => COLORS[id % COLORS.length]

const toIsoDateTime = (fecha: string, hora?: string | null) => {
  const datePart = fecha.slice(0, 10)
  const timePart = (hora ?? '00:00:00').slice(0, 8)
  return `${datePart}T${timePart}`
}

const events = computed<EventInput[]>(() =>
  props.actividades.map((actividad) => {
    const { bg, border } = colorFor(actividad.id)

    return {
      id: String(actividad.id),
      title: actividad.titulo,
      start: toIsoDateTime(actividad.fecha_programada, actividad.hora_inicio_estimada),
      end: toIsoDateTime(actividad.fecha_programada, actividad.hora_fin_estimada),
      backgroundColor: bg,
      borderColor: border,
      textColor: '#fff',
      extendedProps: { actividad },
    }
  }),
)

const calendarOptions = computed(() => ({
  plugins: [dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin],
  initialView: isMobile.value ? 'listWeek' : 'dayGridMonth',
  locale: esLocale,
  height: 'auto',
  firstDay: 1,
  headerToolbar: {
    left: isMobile.value ? 'prev,next' : 'prev,next today',
    center: 'title',
    right: isMobile.value ? 'dayGridMonth,timeGridWeek,listWeek' : 'dayGridMonth,timeGridWeek,listWeek',
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
  dayMaxEvents: true,
  eventOrder: 'start,-id',
  eventDisplay: 'block',
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
  padding: 2px 6px;
  margin-bottom: 2px;
}

.actividades-calendar :deep(.fc-daygrid-day-events) {
  min-height: auto;
}

.actividades-calendar :deep(.fc-event-title) {
  font-weight: 500;
}

.actividades-calendar :deep(.fc-list-event:hover td) {
  background-color: var(--fc-list-event-hover-bg-color);
}

.actividades-calendar :deep(.fc-list-event-graphic) {
  padding-left: 8px;
}

.actividades-calendar :deep(.fc-list-event-dot) {
  border-width: 4px;
}

.actividades-calendar :deep(.fc-daygrid-day):hover {
  background-color: var(--fc-neutral-bg-color);
  cursor: pointer;
}

@media (max-width: 767px) {
  .actividades-calendar :deep(.fc-toolbar) {
    flex-direction: column;
    gap: 0.5rem;
  }

  .actividades-calendar :deep(.fc-toolbar-chunk) {
    display: flex;
    justify-content: center;
  }

  .actividades-calendar :deep(.fc-toolbar-title) {
    font-size: 0.9rem;
  }

  .actividades-calendar :deep(.fc-button) {
    font-size: 0.7rem;
    padding: 0.3rem 0.5rem;
  }

  .actividades-calendar :deep(.fc-today-button) {
    display: none;
  }
}
</style>
