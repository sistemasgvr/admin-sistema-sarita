<template>
  <div
    class="relative overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.03]"
  >
    <div
      v-if="loading"
      class="absolute inset-0 z-20 flex items-center justify-center bg-white/75 backdrop-blur-[1px] dark:bg-gray-900/75"
    >
      <p class="text-sm text-gray-500 dark:text-gray-400">Cargando actividades...</p>
    </div>

    <div class="flex flex-col gap-3 border-b border-gray-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between dark:border-gray-800">
      <div class="flex flex-wrap items-center gap-2">
        <div class="inline-flex overflow-hidden rounded-lg border border-gray-300 dark:border-gray-700">
          <button
            type="button"
            class="inline-flex h-9 w-9 items-center justify-center text-gray-600 transition hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/5"
            title="Anterior"
            @click="calendarApi?.prev()"
          >
            <AppIcon :name="ICONS.chevronLeft" :size="18" />
          </button>
          <button
            type="button"
            class="inline-flex h-9 w-9 items-center justify-center border-l border-gray-300 text-gray-600 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
            title="Siguiente"
            @click="calendarApi?.next()"
          >
            <AppIcon :name="ICONS.chevronRight" :size="18" />
          </button>
        </div>

        <button
          type="button"
          class="inline-flex h-9 items-center rounded-lg border border-gray-300 px-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
          @click="calendarApi?.today()"
        >
          Hoy
        </button>

        <h3 class="ml-1 text-base font-semibold capitalize text-gray-800 dark:text-white/90">
          {{ titleLabel }}
        </h3>
      </div>

      <div class="inline-flex overflow-hidden rounded-lg border border-gray-300 dark:border-gray-700">
        <button
          v-for="view in viewButtons"
          :key="view.id"
          type="button"
          class="inline-flex h-9 items-center px-3 text-sm font-medium transition"
          :class="
            currentView === view.id
              ? 'bg-brand-500 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50 dark:bg-transparent dark:text-gray-300 dark:hover:bg-white/5'
          "
          @click="changeView(view.id)"
        >
          {{ view.label }}
        </button>
      </div>
    </div>

    <div class="actividades-calendar p-3 sm:p-4" :class="{ 'opacity-60': loading }">
      <FullCalendar ref="calendarRef" :options="calendarOptions" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import FullCalendar from '@fullcalendar/vue3'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import listPlugin from '@fullcalendar/list'
import interactionPlugin from '@fullcalendar/interaction'
import esLocale from '@fullcalendar/core/locales/es'
import type { DateClickArg } from '@fullcalendar/interaction'
import type {
  CalendarApi,
  DatesSetArg,
  EventClickArg,
  EventContentArg,
  EventInput,
  EventMountArg,
} from '@fullcalendar/core'
import type { Actividad } from '@/modules/operativa/actividades/interfaces/actividad.interface'
import AppIcon from '@/shared/components/AppIcon.vue'
import { ICONS } from '@/shared/constants/icons'
import {
  esEnCurso,
  esSinAsignar,
} from '@/modules/operativa/actividades/utils/actividadEstado'

interface ActividadesCalendarProps {
  actividades: Actividad[]
  loading?: boolean
}

const props = withDefaults(defineProps<ActividadesCalendarProps>(), {
  loading: false,
})

const isMobile = ref(false)
const titleLabel = ref('')
const currentView = ref('dayGridMonth')
const calendarRef = ref<InstanceType<typeof FullCalendar>>()

const calendarApi = computed<CalendarApi | undefined>(
  () => calendarRef.value?.getApi?.() as CalendarApi | undefined,
)

const viewButtons = computed(() =>
  isMobile.value
    ? [
        { id: 'dayGridMonth', label: 'Mes' },
        { id: 'listWeek', label: 'Agenda' },
      ]
    : [
        { id: 'dayGridMonth', label: 'Mes' },
        { id: 'timeGridWeek', label: 'Semana' },
        { id: 'listWeek', label: 'Agenda' },
      ],
)

const checkMobile = () => {
  isMobile.value = window.innerWidth < 768
}

onMounted(async () => {
  checkMobile()
  window.addEventListener('resize', checkMobile)
  await nextTick()
  const api = calendarApi.value
  if (api) {
    titleLabel.value = api.view.title
    currentView.value = api.view.type
    syncWeekHeight(api.view.type)
  }
})

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
})

const emit = defineEmits<{
  'select-date': [fecha: string]
  'select-actividad': [actividad: Actividad]
  'range-change': [range: { fechaDesde: string; fechaHasta: string }]
}>()

const FALLBACK_COLORS = [
  { bg: '#2563eb', border: '#1d4ed8' },
  { bg: '#0891b2', border: '#0e7490' },
  { bg: '#7c3aed', border: '#6d28d9' },
  { bg: '#0d9488', border: '#0f766e' },
  { bg: '#4f46e5', border: '#4338ca' },
]

const colorForActividad = (actividad: Actividad) => {
  const prioridad = (actividad.nombre_prioridad ?? '').toUpperCase()
  const estado = (actividad.nombre_estado_actividad ?? '').toUpperCase()

  if (estado.includes('REALIZ')) return { bg: '#64748b', border: '#475569' }
  if (prioridad.includes('ALTA')) return { bg: '#e11d48', border: '#be123c' }
  if (prioridad.includes('MEDIA')) return { bg: '#d97706', border: '#b45309' }
  if (prioridad.includes('BAJA')) return { bg: '#2563eb', border: '#1d4ed8' }
  return FALLBACK_COLORS[actividad.id % FALLBACK_COLORS.length]
}

const toIsoDateTime = (fecha: string, hora?: string | null) => {
  const datePart = fecha.slice(0, 10)
  const timePart = (hora ?? '00:00:00').slice(0, 8)
  return `${datePart}T${timePart}`
}

const formatHora = (value?: string | null) => (value ? value.slice(0, 5) : '')

const buildTooltip = (actividad: Actividad) => {
  const horas = [formatHora(actividad.hora_inicio_estimada), formatHora(actividad.hora_fin_estimada)]
    .filter(Boolean)
    .join(' - ')
  return [
    actividad.titulo,
    actividad.razon_social_cliente || 'Sin cliente',
    [horas, actividad.nombre_prioridad, actividad.nombre_estado_actividad]
      .filter(Boolean)
      .join(' · '),
  ]
    .filter(Boolean)
    .join('\n')
}

/** Sin horario útil (00:00–00:00 / vacío) → todo el día; evita eventos “fantasma” a las 00:00 fuera del rango 06–21. */
const esTodoElDia = (actividad: Actividad) => {
  const ini = formatHora(actividad.hora_inicio_estimada)
  const fin = formatHora(actividad.hora_fin_estimada)
  return (!ini || ini === '00:00') && (!fin || fin === '00:00')
}

const events = computed<EventInput[]>(() =>
  props.actividades.map((actividad) => {
    const { bg, border } = colorForActividad(actividad)
    const fecha = actividad.fecha_programada.slice(0, 10)
    const todoElDia = esTodoElDia(actividad)

    const classNames = [
      esSinAsignar(actividad) ? 'actividad-sin-asignar' : '',
      esEnCurso(actividad) ? 'actividad-en-curso' : '',
    ].filter(Boolean)

    if (todoElDia) {
      return {
        id: String(actividad.id),
        title: actividad.titulo,
        start: fecha,
        allDay: true,
        backgroundColor: bg,
        borderColor: border,
        textColor: '#fff',
        classNames,
        extendedProps: { actividad },
      }
    }

    const start = toIsoDateTime(fecha, actividad.hora_inicio_estimada)
    let end = toIsoDateTime(fecha, actividad.hora_fin_estimada)
    // FullCalendar oculta o colapsa si fin <= inicio
    if (end <= start) {
      const [h, m] = formatHora(actividad.hora_inicio_estimada).split(':').map(Number)
      const endDate = new Date(`${fecha}T${String(h).padStart(2, '0')}:${String(m || 0).padStart(2, '0')}:00`)
      endDate.setMinutes(endDate.getMinutes() + 60)
      end = `${fecha}T${String(endDate.getHours()).padStart(2, '0')}:${String(endDate.getMinutes()).padStart(2, '0')}:00`
    }

    return {
      id: String(actividad.id),
      title: actividad.titulo,
      start,
      end,
      allDay: false,
      backgroundColor: bg,
      borderColor: border,
      textColor: '#fff',
      classNames,
      extendedProps: { actividad },
    }
  }),
)

const escapeHtml = (value: string) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')

const renderEventContent = (arg: EventContentArg) => {
  const actividad = arg.event.extendedProps.actividad as Actividad | undefined
  const timeText = arg.timeText ? escapeHtml(arg.timeText) : ''
  const title = escapeHtml(arg.event.title || 'Sin título')
  const cliente = actividad?.razon_social_cliente
    ? escapeHtml(actividad.razon_social_cliente)
    : ''
  const isTimeGrid = arg.view.type.startsWith('timeGrid')

  if (isTimeGrid) {
    return {
      html: `
        <div class="fc-event-inner fc-event-inner--week">
          ${timeText ? `<span class="fc-event-time-chip">${timeText}</span>` : ''}
          <span class="fc-event-title-text">${title}</span>
          ${cliente ? `<span class="fc-event-client">${cliente}</span>` : ''}
        </div>
      `,
    }
  }

  return {
    html: `
      <div class="fc-event-inner">
        <div class="fc-event-mainline">
          ${timeText ? `<span class="fc-event-time-chip">${timeText}</span>` : ''}
          <span class="fc-event-title-text">${title}</span>
        </div>
        ${cliente ? `<span class="fc-event-client">${cliente}</span>` : ''}
      </div>
    `,
  }
}

const onEventDidMount = (info: EventMountArg) => {
  const actividad = info.event.extendedProps.actividad as Actividad | undefined
  if (!actividad) return
  const tip = buildTooltip(actividad)
  info.el.setAttribute('title', tip)
  info.el.setAttribute('aria-label', tip.replace(/\n/g, ', '))
}

const syncWeekHeight = (viewType: string) => {
  calendarApi.value?.setOption('height', viewType === 'timeGridWeek' ? 720 : 'auto')
}

const changeView = (viewId: string) => {
  calendarApi.value?.changeView(viewId)
  currentView.value = viewId
  syncWeekHeight(viewId)
}

watch(isMobile, (mobile) => {
  const api = calendarApi.value
  if (!api) return
  const next = mobile ? 'listWeek' : 'dayGridMonth'
  if (api.view.type !== next && mobile) {
    api.changeView(next)
    currentView.value = next
    syncWeekHeight(next)
  }
})

const calendarOptions = computed(() => ({
  plugins: [dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin],
  initialView: isMobile.value ? 'listWeek' : 'dayGridMonth',
  locale: esLocale,
  height: 'auto' as const,
  firstDay: 1,
  headerToolbar: false as const,
  events: events.value,
  editable: false,
  selectable: true,
  selectMirror: true,
  dayMaxEvents: 3,
  moreLinkText: (n: number) => `+${n} más`,
  eventOrder: 'start,-id',
  eventDisplay: 'block' as const,
  displayEventTime: true,
  displayEventEnd: false,
  eventMinHeight: 28,
  eventShortHeight: 40,
  eventTimeFormat: {
    hour: '2-digit' as const,
    minute: '2-digit' as const,
    hour12: false,
  },
  slotLabelFormat: {
    hour: '2-digit' as const,
    minute: '2-digit' as const,
    hour12: false,
  },
  slotMinTime: '06:00:00',
  slotMaxTime: '22:00:00',
  scrollTime: '07:00:00',
  slotDuration: '00:30:00',
  slotLabelInterval: '01:00:00',
  allDaySlot: true,
  allDayText: 'Todo el día',
  expandRows: true,
  nowIndicator: true,
  fixedWeekCount: false,
  showNonCurrentDates: true,
  forceEventDuration: true,
  defaultTimedEventDuration: '01:00:00',
  views: {
    timeGridWeek: {
      titleFormat: {
        year: 'numeric' as const,
        month: 'short' as const,
        day: 'numeric' as const,
      },
      dayHeaderFormat: {
        weekday: 'short' as const,
        day: 'numeric' as const,
        month: 'numeric' as const,
      },
      slotMinTime: '06:00:00',
      slotMaxTime: '22:00:00',
      scrollTime: '07:00:00',
      displayEventEnd: false,
    },
    dayGridMonth: {
      dayHeaderFormat: { weekday: 'short' as const },
      displayEventEnd: false,
    },
  },
  eventContent: renderEventContent,
  eventDidMount: onEventDidMount,
  eventClick: (info: EventClickArg) => {
    emit('select-actividad', info.event.extendedProps.actividad as Actividad)
  },
  dateClick: (info: DateClickArg) => {
    emit('select-date', info.dateStr.slice(0, 10))
  },
  datesSet: (info: DatesSetArg) => {
    titleLabel.value = info.view.title
    if (currentView.value !== info.view.type) {
      currentView.value = info.view.type
      syncWeekHeight(info.view.type)
    }
    // FullCalendar usa fin exclusivo; el API filtra con hasta inclusivo.
    const hastaExclusivo = new Date(info.end)
    hastaExclusivo.setDate(hastaExclusivo.getDate() - 1)
    const yyyy = hastaExclusivo.getFullYear()
    const mm = String(hastaExclusivo.getMonth() + 1).padStart(2, '0')
    const dd = String(hastaExclusivo.getDate()).padStart(2, '0')
    emit('range-change', {
      fechaDesde: info.startStr.slice(0, 10),
      fechaHasta: `${yyyy}-${mm}-${dd}`,
    })
  },
}))

defineExpose({ calendarRef })
</script>

<style scoped>
.actividades-calendar {
  --fc-border-color: #e5e7eb;
  --fc-page-bg-color: transparent;
  --fc-neutral-bg-color: #f3f4f6;
  --fc-list-event-hover-bg-color: #eff6ff;
  --fc-today-bg-color: #eff6ff;
  --fc-event-border-color: transparent;
  --fc-daygrid-event-dot-width: 0;
  --cal-header-bg: #f3f4f6;
  --cal-header-fg: #6b7280;
  --cal-today-ring: #93c5fd;
}

.actividades-calendar :deep(.fc) {
  font-family: inherit;
}

.actividades-calendar :deep(.fc-theme-standard .fc-scrollgrid) {
  border: 1px solid var(--fc-border-color);
  border-radius: 0.9rem;
  overflow: hidden;
}

/*
  FullCalendar deja un scroller “fantasma” en cabecera / Todo el día
  para alinear el ancho con el scroll de horas. En Windows se ven las
  flechas ▲▼ de la barra de desplazamiento.
*/
.actividades-calendar :deep(.fc-scrollgrid-section-header .fc-scroller),
.actividades-calendar :deep(
  .fc-scrollgrid-section-body:not(.fc-scrollgrid-section-liquid) .fc-scroller
) {
  overflow: hidden !important;
}

.actividades-calendar :deep(.fc-theme-standard td),
.actividades-calendar :deep(.fc-theme-standard th) {
  border-color: var(--fc-border-color);
}

.actividades-calendar :deep(.fc-col-header),
.actividades-calendar :deep(.fc-col-header-cell),
.actividades-calendar :deep(.fc-scrollgrid-section-header > *),
.actividades-calendar :deep(.fc-theme-standard th) {
  background: var(--cal-header-bg) !important;
  background-color: var(--cal-header-bg) !important;
}

.actividades-calendar :deep(.fc-col-header-cell) {
  padding: 0.55rem 0;
  border-bottom: 1px solid var(--fc-border-color);
}

.actividades-calendar :deep(.fc-col-header-cell-cushion) {
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--cal-header-fg);
  text-decoration: none !important;
}

.actividades-calendar :deep(.fc-daygrid-day) {
  min-height: 7rem;
  transition: background-color 160ms ease;
  cursor: pointer;
}

.actividades-calendar :deep(.fc-daygrid-day-frame) {
  min-height: 7rem;
  padding: 0.2rem;
  transition: background-color 160ms ease;
}

/* Hover claro y visible en cada día */
.actividades-calendar :deep(.fc-daygrid-day:hover .fc-daygrid-day-frame) {
  background-color: #dbeafe;
}

.actividades-calendar :deep(.fc-daygrid-day:hover .fc-daygrid-day-number) {
  background-color: #2563eb;
  color: #fff;
}

.actividades-calendar :deep(.fc-daygrid-day-number) {
  font-size: 0.8rem;
  font-weight: 600;
  color: #374151;
  width: 1.75rem;
  height: 1.75rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin: 0.25rem;
  border-radius: 9999px;
  text-decoration: none !important;
  transition:
    background-color 160ms ease,
    color 160ms ease,
    transform 160ms ease;
}

.actividades-calendar :deep(.fc-day-today) {
  background: transparent !important;
}

.actividades-calendar :deep(.fc-day-today .fc-daygrid-day-frame) {
  background-color: var(--fc-today-bg-color);
  box-shadow: inset 0 0 0 1px var(--cal-today-ring);
}

.actividades-calendar :deep(.fc-day-today .fc-daygrid-day-number) {
  background-color: #2563eb;
  color: #fff;
}

.actividades-calendar :deep(.fc-day-other .fc-daygrid-day-number) {
  color: #9ca3af;
  font-weight: 500;
}

.actividades-calendar :deep(.fc-event) {
  cursor: pointer;
  border: 0 !important;
  border-radius: 0.5rem;
  margin: 1px 3px 3px;
  padding: 0;
  box-shadow: 0 1px 2px rgb(0 0 0 / 0.1);
  transition:
    transform 150ms ease,
    box-shadow 150ms ease,
    filter 150ms ease;
}

.actividades-calendar :deep(.fc-event:hover) {
  transform: translateY(-1px);
  box-shadow: 0 6px 14px rgb(0 0 0 / 0.16);
  filter: brightness(1.06);
  z-index: 6;
}

.actividades-calendar :deep(.fc-event-inner) {
  display: flex;
  flex-direction: column;
  gap: 1px;
  padding: 3px 7px;
  min-width: 0;
}

.actividades-calendar :deep(.fc-event-inner--week) {
  height: 100%;
  padding: 3px 5px;
  overflow: hidden;
}

.actividades-calendar :deep(.fc-event-mainline) {
  display: flex;
  align-items: baseline;
  gap: 0.3rem;
  min-width: 0;
}

.actividades-calendar :deep(.fc-event-time-chip) {
  flex-shrink: 0;
  font-size: 0.65rem;
  font-weight: 700;
  line-height: 1.15;
  opacity: 0.95;
}

.actividades-calendar :deep(.fc-event-title-text) {
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.actividades-calendar :deep(.fc-event-inner--week .fc-event-title-text) {
  font-size: 0.72rem;
  line-height: 1.2;
  white-space: normal;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.actividades-calendar :deep(.fc-event-client) {
  display: block;
  font-size: 0.65rem;
  line-height: 1.2;
  opacity: 0.88;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.actividades-calendar :deep(.fc-daygrid-more-link) {
  font-size: 0.7rem;
  font-weight: 700;
  color: #2563eb;
  margin: 2px 4px;
  border-radius: 0.375rem;
  padding: 2px 6px;
  transition: background-color 150ms ease;
}

.actividades-calendar :deep(.fc-daygrid-more-link:hover) {
  background-color: #dbeafe;
}

.actividades-calendar :deep(.fc-list) {
  border: 1px solid var(--fc-border-color);
  border-radius: 0.9rem;
  overflow: hidden;
}

.actividades-calendar :deep(.fc-list-day-cushion) {
  background: var(--cal-header-bg);
}

.actividades-calendar :deep(.fc-list-event) {
  cursor: pointer;
  transition: background-color 150ms ease;
}

.actividades-calendar :deep(.fc-list-event:hover td) {
  background-color: var(--fc-list-event-hover-bg-color) !important;
}

.actividades-calendar :deep(.fc-timegrid-now-indicator-line) {
  border-color: #ef4444;
}

.actividades-calendar :deep(.fc-timegrid-now-indicator-arrow) {
  border-top-color: #ef4444;
  border-bottom-color: #ef4444;
}

.actividades-calendar :deep(.fc-timegrid-axis-cushion),
.actividades-calendar :deep(.fc-timegrid-slot-label-cushion) {
  font-size: 0.72rem;
  font-weight: 600;
  color: var(--cal-header-fg);
}

.actividades-calendar :deep(.fc-timegrid-slot) {
  height: 2.15rem;
  transition: background-color 120ms ease;
}

.actividades-calendar :deep(.fc-timegrid-slot-lane:hover),
.actividades-calendar :deep(.fc-timegrid-col:hover .fc-timegrid-slot-lane) {
  background-color: transparent;
}

/* Hover por celda horaria (columna × franja) */
.actividades-calendar :deep(.fc-timegrid-col-frame) {
  transition: background-color 120ms ease;
}

.actividades-calendar :deep(.fc-timegrid-col:hover .fc-timegrid-col-frame) {
  background-color: rgb(37 99 235 / 0.04);
}

.actividades-calendar :deep(.fc-timegrid-col.fc-day-today .fc-timegrid-col-frame) {
  background-color: var(--fc-today-bg-color);
}

.actividades-calendar :deep(.fc-timegrid-col.fc-day-today .fc-col-header-cell-cushion) {
  color: #2563eb;
}

/* Fila "Todo el día" compacta en semana (no hereda min-height del mes) */
.actividades-calendar :deep(.fc-timegrid .fc-daygrid-body) {
  min-height: 0 !important;
}

.actividades-calendar :deep(.fc-timegrid .fc-daygrid-day) {
  min-height: 0;
}

.actividades-calendar :deep(.fc-timegrid .fc-daygrid-day-frame) {
  min-height: 2rem;
}

.actividades-calendar :deep(.fc-timegrid .fc-daygrid-day:hover .fc-daygrid-day-frame) {
  background-color: #dbeafe;
}

.actividades-calendar :deep(.fc-timegrid-axis-frame) {
  max-height: 2.25rem;
}

.actividades-calendar :deep(.fc-timegrid-event) {
  border-radius: 0.45rem;
  box-shadow: 0 1px 3px rgb(0 0 0 / 0.12);
  overflow: hidden;
  margin: 0 1px;
}

.actividades-calendar :deep(.fc-timegrid-event-harness) {
  margin-right: 2px;
}

/* Solapes: cada evento ocupa su franja sin “romper” el contenido */
.actividades-calendar :deep(.fc-timegrid-event .fc-event-main) {
  padding: 0;
  height: 100%;
}

.actividades-calendar :deep(.fc-timegrid-event.fc-event-short .fc-event-client) {
  display: none;
}

.actividades-calendar :deep(.fc-timegrid-event.fc-event-short .fc-event-title-text) {
  display: block;
  -webkit-line-clamp: unset;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.actividades-calendar :deep(.fc-scrollgrid-sync-inner) {
  min-height: 100%;
}

.actividades-calendar :deep(.fc-timegrid-divider) {
  padding: 0;
  border-color: var(--fc-border-color);
}

@media (max-width: 767px) {
  .actividades-calendar :deep(.fc-daygrid-day),
  .actividades-calendar :deep(.fc-daygrid-day-frame) {
    min-height: 4.75rem;
  }

  .actividades-calendar :deep(.fc-event-client) {
    display: none;
  }
}

/* Actividad sin asignar: disponible para tomar (borde punteado, fondo claro) */
.actividades-calendar :deep(.fc-event.actividad-sin-asignar) {
  background-color: #f1f5f9 !important;
  border: 2px dashed #94a3b8 !important;
  color: #334155 !important;
}

.actividades-calendar :deep(.fc-event.actividad-sin-asignar .fc-event-time),
.actividades-calendar :deep(.fc-event.actividad-sin-asignar .fc-event-title) {
  color: #334155 !important;
}

/* Actividad en curso: asignada y no cerrada (resalte verde) */
.actividades-calendar :deep(.fc-event.actividad-en-curso) {
  box-shadow:
    0 0 0 2px rgba(34, 197, 94, 0.9),
    0 1px 3px rgb(0 0 0 / 0.12) !important;
}
</style>

<!--
  Modo oscuro en bloque sin scoped: Vue/Vite rompe
  `:global(.dark) .actividades-calendar` y lo deja como solo `.dark { ... }`.
-->
<style>
html.dark .actividades-calendar {
  --fc-border-color: #1f2937;
  --fc-neutral-bg-color: rgb(255 255 255 / 0.04);
  --fc-list-event-hover-bg-color: rgb(37 99 235 / 0.14);
  --fc-today-bg-color: rgb(37 99 235 / 0.16);
  --cal-header-bg: #111827;
  --cal-header-fg: #9ca3af;
  --cal-today-ring: rgb(59 130 246 / 0.45);
}

html.dark .actividades-calendar .fc-daygrid-day-number {
  color: rgb(255 255 255 / 0.88);
}

html.dark .actividades-calendar .fc-daygrid-day:hover .fc-daygrid-day-frame,
html.dark .actividades-calendar .fc-timegrid .fc-daygrid-day:hover .fc-daygrid-day-frame {
  background-color: rgb(37 99 235 / 0.18);
}

html.dark .actividades-calendar .fc-col-header,
html.dark .actividades-calendar .fc-col-header-cell,
html.dark .actividades-calendar .fc-scrollgrid-section-header > *,
html.dark .actividades-calendar .fc-theme-standard th {
  background: #111827 !important;
  background-color: #111827 !important;
}

html.dark .actividades-calendar .fc-col-header-cell-cushion {
  color: #9ca3af !important;
}

html.dark .actividades-calendar :deep(.fc-event.actividad-sin-asignar) {
  background-color: rgb(148 163 184 / 0.18) !important;
  border: 2px dashed rgb(148 163 184 / 0.7) !important;
  color: rgb(226 232 240 / 0.95) !important;
}

html.dark .actividades-calendar :deep(.fc-event.actividad-sin-asignar .fc-event-time),
html.dark .actividades-calendar :deep(.fc-event.actividad-sin-asignar .fc-event-title) {
  color: rgb(226 232 240 / 0.95) !important;
}
</style>
