<template>
  <AppFormField :label="label" :hint="hint" :error="error" :required="required" :disabled="disabled" :id="id">
    <template #default="{ id: fieldId }">
      <div ref="triggerWrapRef" class="relative">
        <div
          class="flex h-11 w-full items-stretch overflow-hidden rounded-lg bg-transparent shadow-theme-xs transition-colors focus-within:border-brand-300 focus-within:outline-hidden focus-within:ring-3 focus-within:ring-brand-500/10 dark:focus-within:border-brand-800"
          :class="triggerClasses"
        >
          <input
            :id="fieldId"
            type="text"
            :value="rangeTextDraft"
            :name="name"
            inputmode="numeric"
            autocomplete="off"
            maxlength="23"
            :placeholder="placeholder"
            :disabled="disabled"
            class="min-w-0 flex-1 border-0 bg-transparent px-3 py-2.5 text-sm text-gray-800 outline-none placeholder:text-gray-400 focus:ring-0 dark:text-white/90 dark:placeholder:text-white/30"
            v-bind="inputAttrs"
            @input="onRangeTextInput"
            @focus="isRangeTextFocused = true"
            @blur="onRangeTextBlur"
            @keydown.enter.prevent="commitRangeTextFromInput"
          />
          <button
            type="button"
            class="flex shrink-0 items-center justify-center border-l border-gray-200 px-3 dark:border-gray-600"
            :class="disabled ? 'cursor-not-allowed opacity-60' : 'hover:bg-gray-50 dark:hover:bg-gray-800/80'"
            :disabled="disabled"
            aria-label="Abrir calendario de rango"
            @click="toggleOpen"
          >
            <AppIcon :name="ICONS.calendarRange" :size="20" class="shrink-0 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <Teleport to="body">
          <Transition name="app-date-range">
            <div v-if="isOpen" ref="panelRef"
              class="fixed z-[100002] min-w-[300px] max-w-[min(100vw-2rem,360px)] overflow-y-auto overflow-x-hidden rounded-xl border border-gray-200 bg-white shadow-theme-lg dark:border-gray-700 dark:bg-gray-900"
              :style="panelStyle">
              <!-- Header -->
              <div class="flex items-center justify-between border-b border-gray-100 px-3 py-2.5 dark:border-gray-700/80">
                <button type="button"
                  class="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
                  :aria-label="navLabelPrev" @click="navigatePrev">
                  <AppIcon :name="ICONS.chevronLeft" :size="16" />
                </button>

                <button v-if="calendarView === 'day'" type="button"
                  class="flex select-none items-center gap-1 rounded-lg px-2 py-1 text-sm font-semibold text-gray-800 transition-colors hover:bg-gray-100 dark:text-gray-100 dark:hover:bg-gray-800"
                  @click="calendarView = 'month'">
                  <span class="capitalize">{{ currentMonthName }}</span>
                  <span class="text-brand-600 dark:text-brand-400">{{ calendarYear }}</span>
                  <AppIcon :name="ICONS.chevronDown" :size="14" class="text-gray-400 dark:text-gray-500" />
                </button>
                <button v-else-if="calendarView === 'month'" type="button"
                  class="flex select-none items-center gap-1 rounded-lg px-2 py-1 text-sm font-semibold text-gray-800 transition-colors hover:bg-gray-100 dark:text-gray-100 dark:hover:bg-gray-800"
                  @click="calendarView = 'year'">
                  <span class="text-brand-600 dark:text-brand-400">{{ calendarYear }}</span>
                  <AppIcon :name="ICONS.chevronDown" :size="14" class="text-gray-400 dark:text-gray-500" />
                </button>
                <span v-else class="select-none px-2 text-sm font-semibold text-gray-800 dark:text-gray-100">
                  {{ decadeStart }} – {{ decadeStart + 11 }}
                </span>

                <button type="button"
                  class="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
                  :aria-label="navLabelNext" @click="navigateNext">
                  <AppIcon :name="ICONS.chevronRight" :size="16" />
                </button>
              </div>

              <!-- Day grid -->
              <template v-if="calendarView === 'day'">
                <div class="grid grid-cols-7 gap-1 px-3 pb-1 pt-2.5">
                  <div v-for="wd in WEEK_DAYS" :key="wd"
                    class="py-1 text-center text-[10px] font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
                    {{ wd }}
                  </div>
                </div>
                <div class="grid grid-cols-7 gap-1 px-3 pb-2">
                  <template v-for="(day, idx) in calendarDays" :key="idx">
                    <div v-if="!day" class="h-9" />
                    <div v-else class="relative flex h-9 w-full items-center justify-center">
                      <template v-if="rangeBridges(day)">
                        <div v-if="rangeBridges(day) === 'between'"
                          class="absolute inset-y-1.5 left-1 right-1 rounded-full bg-brand-100/95 dark:bg-brand-900/45" />
                        <div v-else-if="rangeBridges(day) === 'start-bar'"
                          class="absolute inset-y-1.5 left-1/2 right-1 rounded-r-full bg-brand-100/95 dark:bg-brand-900/45" />
                        <div v-else-if="rangeBridges(day) === 'end-bar'"
                          class="absolute inset-y-1.5 left-1 right-1/2 rounded-l-full bg-brand-100/95 dark:bg-brand-900/45" />
                      </template>
                      <button type="button" :disabled="isDayDisabled(day)"
                        class="relative z-10 flex items-center justify-center text-sm font-medium transition-colors"
                        :class="dayButtonClass(day)" @click="onSelectDay(day)">
                        {{ day.getDate() }}
                      </button>
                    </div>
                  </template>
                </div>
              </template>

              <!-- Month grid -->
              <div v-else-if="calendarView === 'month'" class="grid grid-cols-3 gap-1.5 p-3">
                <button v-for="(mName, idx) in MONTH_NAMES" :key="idx" type="button"
                  class="rounded-lg py-2.5 text-sm font-medium transition-all duration-100" :class="getMonthClasses(idx)"
                  :disabled="isMonthDisabled(idx)" @click="selectMonth(idx)">
                  {{ mName.slice(0, 3) }}
                </button>
              </div>

              <!-- Year grid -->
              <div v-else class="grid grid-cols-3 gap-1.5 p-3">
                <button v-for="yr in decadeYears" :key="yr" type="button"
                  class="rounded-lg py-2.5 text-sm font-medium transition-all duration-100" :class="getYearClasses(yr)"
                  :disabled="isYearDisabled(yr)" @click="selectYear(yr)">
                  {{ yr }}
                </button>
              </div>

              <div v-if="calendarView === 'day'"
                class="flex items-center justify-between border-t border-gray-100 bg-gray-50 px-4 py-2 dark:border-gray-700/80 dark:bg-gray-800/60">
                <button type="button"
                  class="rounded-md px-2 py-1 text-xs font-medium text-gray-500 transition-colors hover:bg-red-50 hover:text-red-500 dark:text-gray-400 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                  @click="clearRange">
                  Borrar
                </button>
                <button type="button"
                  class="rounded-md px-2 py-1 text-xs font-semibold text-brand-600 transition-colors hover:bg-brand-50 enabled:hover:text-brand-700 disabled:cursor-not-allowed disabled:opacity-40 dark:text-brand-400 dark:hover:bg-brand-900/20 dark:hover:text-brand-300"
                  :disabled="isDayDisabled(new Date())" @click="selectTodayRange">
                  Hoy
                </button>
              </div>
            </div>
          </Transition>
        </Teleport>
      </div>
    </template>
  </AppFormField>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, useAttrs, watch } from 'vue'
import AppFormField from '@/shared/components/form/AppFormField.vue'
import AppIcon from '@/shared/components/AppIcon.vue'
import { ICONS } from '@/shared/constants/icons'
import type { RangoFechas } from '@/shared/interfaces/form.interface'
import {
  WEEK_DAYS,
  MONTH_NAMES,
  formatYMD,
  parseYMD,
  displayDDMMYYYY,
  buildCalendarDays,
  isSameDay,
  isToday,
  compareDay,
  parseBoundary,
} from '@/shared/utils/dateRange'
import {
  formatRangeInputMasked,
  rangeInputDigitIndexAtCursor,
  cursorPositionForRangeFormatted,
  splitRangeInputByEmDash,
  parseDdMmYyyyStringToDate,
  parseSegmentForCalendarNav,
  getEmDashSepBounds,
} from '@/shared/utils/dateRangeMask'

type CalendarView = 'day' | 'month' | 'year'

defineOptions({
  inheritAttrs: false,
})

interface AppDateRangePickerProps {
  label?: string
  placeholder?: string
  disabled?: boolean
  error?: string
  hint?: string
  required?: boolean
  name?: string
  id?: string
  min?: number | string
  max?: number | string
}

const props = withDefaults(defineProps<AppDateRangePickerProps>(), {
  placeholder: 'Desde — hasta',
})

const model = defineModel<RangoFechas>({ default: () => ({ start: '', end: '' }) })

const attrs = useAttrs()
const triggerWrapRef = ref<HTMLElement | null>(null)
const panelRef = ref<HTMLElement | null>(null)
const panelStyle = ref<Record<string, string>>({})
const isOpen = ref(false)
/** Texto editable del rango (dd/mm/aaaa — dd/mm/aaaa); el v-model sigue siendo ISO en start/end. */
const rangeTextDraft = ref('')
const isRangeTextFocused = ref(false)
const calendarView = ref<CalendarView>('day')
const calendarMonth = ref(new Date().getMonth())
const calendarYear = ref(new Date().getFullYear())
const decadeStart = ref(Math.floor(new Date().getFullYear() / 12) * 12)

const inputAttrs = computed(() => {
  const { class: _class, style: _style, ...rest } = attrs
  return rest
})

const startDate = computed(() => (model.value.start ? parseYMD(model.value.start) : null))
const endDate = computed(() => (model.value.end ? parseYMD(model.value.end) : null))

/** Inicio/fin desde el texto del input (mismo criterio que al confirmar). */
function parseRangeDraftToDates(draft: string): { start: Date | null; end: Date | null } {
  const t = draft.trim()
  if (!t) return { start: null, end: null }
  const { leftRaw, rightRaw } = splitRangeInputByEmDash(t)
  const dt1 = parseDdMmYyyyStringToDate(leftRaw)
  if (!dt1 || isDayDisabled(dt1)) return { start: null, end: null }
  if (!rightRaw.trim()) return { start: dt1, end: null }
  const dt2 = parseDdMmYyyyStringToDate(rightRaw)
  if (!dt2 || isDayDisabled(dt2)) return { start: dt1, end: null }
  let a = dt1
  let b = dt2
  if (compareDay(b, a) < 0) [a, b] = [b, a]
  return { start: a, end: b }
}

/** Con el popup abierto, el calendario refleja el borrador tipiado; si no parsea, el modelo. */
const calendarRangeStart = computed((): Date | null => {
  if (!isOpen.value) return startDate.value
  const p = parseRangeDraftToDates(rangeTextDraft.value)
  return p.start ?? startDate.value
})

const calendarRangeEnd = computed((): Date | null => {
  if (!isOpen.value) return endDate.value
  const p = parseRangeDraftToDates(rangeTextDraft.value)
  if (p.start && p.end) return p.end
  if (p.start && !p.end) return null
  return endDate.value
})

function rangeTextFromModel(m: RangoFechas): string {
  const a = displayDDMMYYYY(m.start)
  const b = displayDDMMYYYY(m.end)
  if (a && b) return `${a} — ${b}`
  if (a) return `${a} — `
  return ''
}

function notifyBlur() {
  const onBlur = attrs.onBlur
  if (typeof onBlur === 'function') {
    onBlur(new FocusEvent('blur'))
  }
}

function commitRangeTextFromInput() {
  const t = rangeTextDraft.value.trim()
  if (!t) {
    model.value = { start: '', end: '' }
    rangeTextDraft.value = ''
    return
  }
  const { leftRaw, rightRaw } = splitRangeInputByEmDash(t)
  const dt1 = parseDdMmYyyyStringToDate(leftRaw)
  if (!dt1 || isDayDisabled(dt1)) {
    rangeTextDraft.value = rangeTextFromModel(model.value)
    return
  }
  let start = formatYMD(dt1)
  let end = ''
  if (rightRaw.trim()) {
    const dt2 = parseDdMmYyyyStringToDate(rightRaw)
    if (!dt2 || isDayDisabled(dt2)) {
      rangeTextDraft.value = rangeTextFromModel(model.value)
      return
    }
    end = formatYMD(dt2)
    const a = parseYMD(start)!
    const b = parseYMD(end)!
    if (compareDay(a, b) > 0) {
      const tmp = start
      start = end
      end = tmp
    }
  }
  model.value = { start, end }
  rangeTextDraft.value = rangeTextFromModel({ start, end })
}

/** Si el borrador es parseable, actualiza el modelo (p. ej. al abrir el calendario). */
function applyDraftToModelOnPickerOpen() {
  const t = rangeTextDraft.value.trim()
  if (!t) return
  const { leftRaw, rightRaw } = splitRangeInputByEmDash(t)
  const dt1 = parseDdMmYyyyStringToDate(leftRaw)
  if (!dt1 || isDayDisabled(dt1)) return
  let start = formatYMD(dt1)
  let end = ''
  if (rightRaw.trim()) {
    const dt2 = parseDdMmYyyyStringToDate(rightRaw)
    if (!dt2 || isDayDisabled(dt2)) return
    end = formatYMD(dt2)
    const a = parseYMD(start)!
    const b = parseYMD(end)!
    if (compareDay(a, b) > 0) {
      const tmp = start
      start = end
      end = tmp
    }
  }
  if (start !== model.value.start || end !== model.value.end) {
    model.value = { start, end }
  }
  rangeTextDraft.value = rangeTextFromModel({ start, end })
}

function onRangeTextInput(e: Event) {
  const el = e.target as HTMLInputElement
  const raw = el.value
  const sel = el.selectionStart ?? raw.length
  const digitIdx = rangeInputDigitIndexAtCursor(raw, sel)
  const sepBounds = getEmDashSepBounds(raw)
  const cursorAfterSep = !!(sepBounds && sel >= sepBounds.sepEnd)
  const formatted = formatRangeInputMasked(raw)
  rangeTextDraft.value = formatted
  nextTick(() => {
    const pos = cursorPositionForRangeFormatted(formatted, digitIdx, cursorAfterSep)
    el.setSelectionRange(pos, pos)
  })
}

function onRangeTextBlur() {
  commitRangeTextFromInput()
  isRangeTextFocused.value = false
  notifyBlur()
}

/** Con el panel abierto: alinea mes/año del calendario con el segmento que se está editando. */
function syncOpenCalendarWithRangeTextDraft() {
  if (!isOpen.value) return
  const { leftRaw, rightRaw } = splitRangeInputByEmDash(rangeTextDraft.value)
  const nav = parseSegmentForCalendarNav(rightRaw) ?? parseSegmentForCalendarNav(leftRaw)
  if (!nav) return
  const tentative = new Date(nav.y, nav.mIndex0, nav.d)
  if (!Number.isNaN(tentative.getTime()) && !isDayDisabled(tentative)) {
    calendarMonth.value = nav.mIndex0
    calendarYear.value = nav.y
    decadeStart.value = Math.floor(nav.y / 12) * 12
  }
}

const triggerClasses = computed(() => {
  const base =
    'border border-gray-300 bg-transparent focus-within:border-brand-300 focus-within:outline-hidden focus-within:ring-3 focus-within:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:focus-within:border-brand-800'
  const err =
    'border border-red-500 focus-within:border-red-500 focus-within:ring-red-500/10 dark:border-red-500'
  const dis = 'cursor-not-allowed bg-gray-100 opacity-60 dark:bg-gray-800'
  return [props.error ? err : base, props.disabled ? dis : ''].filter(Boolean).join(' ')
})

const currentMonthName = computed(() => MONTH_NAMES[calendarMonth.value])
const decadeYears = computed(() => Array.from({ length: 12 }, (_, i) => decadeStart.value + i))

const navLabelPrev = computed(() =>
  calendarView.value === 'day'
    ? 'Mes anterior'
    : calendarView.value === 'month'
      ? 'Año anterior'
      : 'Período anterior',
)
const navLabelNext = computed(() =>
  calendarView.value === 'day'
    ? 'Mes siguiente'
    : calendarView.value === 'month'
      ? 'Año siguiente'
      : 'Período siguiente',
)

const calendarDays = computed(() => buildCalendarDays(calendarYear.value, calendarMonth.value))

const minD = computed(() => parseBoundary(props.min))
const maxD = computed(() => parseBoundary(props.max))

function isDayDisabled(date: Date): boolean {
  if (props.disabled) return true
  if (minD.value && compareDay(date, minD.value) < 0) return true
  if (maxD.value && compareDay(date, maxD.value) > 0) return true
  return false
}

function isMonthDisabled(monthIdx: number): boolean {
  const y = calendarYear.value
  if (minD.value && new Date(y, monthIdx + 1, 0) < minD.value) return true
  if (maxD.value && new Date(y, monthIdx, 1) > maxD.value) return true
  return false
}

function isYearDisabled(year: number): boolean {
  if (minD.value && new Date(year, 11, 31) < minD.value) return true
  if (maxD.value && new Date(year, 0, 1) > maxD.value) return true
  return false
}

/** Puentes visuales entre celdas para el rango (medio, media luna inicio/fin). */
function rangeBridges(day: Date): 'between' | 'start-bar' | 'end-bar' | null {
  const s = calendarRangeStart.value
  const e = calendarRangeEnd.value
  if (!s || !e) return null
  if (isSameDay(s, e)) return null
  if (compareDay(day, s) < 0 || compareDay(day, e) > 0) return null
  if (isSameDay(day, s)) return 'start-bar'
  if (isSameDay(day, e)) return 'end-bar'
  return 'between'
}

type DayRole =
  | 'start-cap'
  | 'end-cap'
  | 'single'
  | 'between'
  | 'partial'
  | 'start-cap-disabled'
  | 'end-cap-disabled'
  | 'single-disabled'
  | 'between-disabled'
  | 'partial-disabled'
  | 'today'
  | 'muted'
  | 'normal'

function dayRole(day: Date): DayRole {
  const disabled = isDayDisabled(day)
  const s = calendarRangeStart.value
  const e = calendarRangeEnd.value
  if (!s) return disabled ? 'muted' : isToday(day) ? 'today' : 'normal'

  if (!e) {
    if (isSameDay(day, s)) return disabled ? 'partial-disabled' : 'partial'
    return disabled ? 'muted' : isToday(day) ? 'today' : 'normal'
  }

  if (isSameDay(s, e)) {
    if (isSameDay(day, s)) return disabled ? 'single-disabled' : 'single'
    return disabled ? 'muted' : isToday(day) ? 'today' : 'normal'
  }

  if (isSameDay(day, s)) return disabled ? 'start-cap-disabled' : 'start-cap'
  if (isSameDay(day, e)) return disabled ? 'end-cap-disabled' : 'end-cap'
  if (compareDay(day, s) > 0 && compareDay(day, e) < 0) return disabled ? 'between-disabled' : 'between'
  return disabled ? 'muted' : isToday(day) ? 'today' : 'normal'
}

function dayButtonClass(day: Date): string {
  const role = dayRole(day)
  const cap = 'size-9 shrink-0 rounded-full bg-brand-600 text-white shadow-sm hover:bg-brand-700'
  const capDisabled =
    'size-9 shrink-0 cursor-not-allowed rounded-full bg-brand-200 text-brand-700 dark:bg-brand-800/45 dark:text-brand-200'
  const between = 'h-9 min-h-[2.25rem] w-full max-w-none rounded-full bg-transparent text-brand-800 dark:text-brand-200'
  const betweenDisabled =
    'h-9 min-h-[2.25rem] w-full max-w-none cursor-not-allowed rounded-full bg-transparent text-brand-700/85 dark:text-brand-200/80'
  const todayRing =
    'size-9 shrink-0 rounded-full ring-1 ring-inset ring-brand-500 text-brand-700 dark:text-brand-300'
  const normal =
    'size-9 shrink-0 rounded-full text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700/60'
  const muted = 'size-9 shrink-0 cursor-not-allowed rounded-full text-gray-300 dark:text-gray-600'

  switch (role) {
    case 'muted':
      return muted
    case 'start-cap':
    case 'end-cap':
    case 'single':
    case 'partial':
      return cap
    case 'start-cap-disabled':
    case 'end-cap-disabled':
    case 'single-disabled':
    case 'partial-disabled':
      return capDisabled
    case 'between':
      return between
    case 'between-disabled':
      return betweenDisabled
    case 'today':
      return todayRing
    default:
      return normal
  }
}

function onSelectDay(day: Date) {
  if (isDayDisabled(day)) return
  const ymd = formatYMD(day)
  const curS = model.value.start
  const curE = model.value.end

  if (!curS || (curS && curE)) {
    model.value = { start: ymd, end: '' }
    rangeTextDraft.value = rangeTextFromModel({ start: ymd, end: '' })
    return
  }

  let a = parseYMD(curS)!
  let b = day
  if (compareDay(b, a) < 0) [a, b] = [b, a]
  const start = formatYMD(a)
  const end = formatYMD(b)
  model.value = { start, end }
  rangeTextDraft.value = rangeTextFromModel({ start, end })
}

function selectMonth(idx: number) {
  if (isMonthDisabled(idx)) return
  calendarMonth.value = idx
  calendarView.value = 'day'
}

function selectYear(year: number) {
  if (isYearDisabled(year)) return
  calendarYear.value = year
  decadeStart.value = Math.floor(year / 12) * 12
  calendarView.value = 'month'
}

function navigatePrev() {
  if (calendarView.value === 'day') {
    if (calendarMonth.value === 0) {
      calendarMonth.value = 11
      calendarYear.value--
    } else calendarMonth.value--
  } else if (calendarView.value === 'month') {
    calendarYear.value--
  } else {
    decadeStart.value -= 12
  }
}

function navigateNext() {
  if (calendarView.value === 'day') {
    if (calendarMonth.value === 11) {
      calendarMonth.value = 0
      calendarYear.value++
    } else calendarMonth.value++
  } else if (calendarView.value === 'month') {
    calendarYear.value++
  } else {
    decadeStart.value += 12
  }
}

function syncCalendarFromModel() {
  const s = calendarRangeStart.value
  const e = calendarRangeEnd.value
  const d = s ?? e ?? new Date()
  calendarMonth.value = d.getMonth()
  calendarYear.value = d.getFullYear()
  decadeStart.value = Math.floor(d.getFullYear() / 12) * 12
}

function toggleOpen() {
  if (props.disabled) return
  const opening = !isOpen.value
  if (opening) {
    applyDraftToModelOnPickerOpen()
  }
  isOpen.value = opening
  if (isOpen.value) {
    calendarView.value = 'day'
    syncCalendarFromModel()
  } else {
    notifyBlur()
  }
}

function clearRange() {
  model.value = { start: '', end: '' }
  rangeTextDraft.value = ''
  isOpen.value = false
  notifyBlur()
}

function selectTodayRange() {
  const t = new Date()
  if (isDayDisabled(t)) return
  const ymd = formatYMD(t)
  model.value = { start: ymd, end: ymd }
  rangeTextDraft.value = rangeTextFromModel({ start: ymd, end: ymd })
}

function getMonthClasses(idx: number): string {
  if (isMonthDisabled(idx)) {
    return 'cursor-not-allowed text-gray-300 opacity-50 dark:text-gray-600'
  }
  if (calendarMonth.value === idx) {
    return 'bg-brand-50 font-semibold text-brand-700 dark:bg-brand-900/30 dark:text-brand-300'
  }
  return 'text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700/60'
}

function getYearClasses(yr: number): string {
  const ty = new Date().getFullYear()
  if (isYearDisabled(yr)) {
    return 'cursor-not-allowed text-gray-300 opacity-50 dark:text-gray-600'
  }
  if (calendarYear.value === yr) {
    return 'bg-brand-50 font-semibold text-brand-700 dark:bg-brand-900/30 dark:text-brand-300'
  }
  if (ty === yr) {
    return 'ring-1 ring-inset ring-brand-500 text-brand-700 dark:text-brand-300'
  }
  return 'text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700/60'
}

function updatePanelPosition() {
  const trigger = triggerWrapRef.value
  if (!trigger) return

  const rect = trigger.getBoundingClientRect()
  const viewportPadding = 8
  const gap = 4
  const panelWidth = Math.min(360, window.innerWidth - viewportPadding * 2)
  const estimatedHeight = 380

  let left = rect.left
  if (left + panelWidth > window.innerWidth - viewportPadding) {
    left = Math.max(viewportPadding, window.innerWidth - viewportPadding - panelWidth)
  }

  const spaceBelow = window.innerHeight - rect.bottom - viewportPadding
  const spaceAbove = rect.top - viewportPadding
  const openUpward = spaceBelow < estimatedHeight && spaceAbove > spaceBelow

  const top = openUpward
    ? Math.max(viewportPadding, rect.top - gap - estimatedHeight)
    : rect.bottom + gap

  panelStyle.value = {
    top: `${top}px`,
    left: `${left}px`,
  }
}

function onResizeOrScroll() {
  if (isOpen.value) updatePanelPosition()
}

function onDocMouseDown(e: Event) {
  const t = e.target as Node
  if (triggerWrapRef.value?.contains(t) || panelRef.value?.contains(t)) return
  if (isOpen.value) {
    isOpen.value = false
    notifyBlur()
  }
}

onMounted(() => {
  document.addEventListener('mousedown', onDocMouseDown, true)
  document.addEventListener('touchstart', onDocMouseDown, { passive: true })
  window.addEventListener('resize', onResizeOrScroll)
  document.addEventListener('scroll', onResizeOrScroll, true)
})
onUnmounted(() => {
  document.removeEventListener('mousedown', onDocMouseDown, true)
  document.removeEventListener('touchstart', onDocMouseDown)
  window.removeEventListener('resize', onResizeOrScroll)
  document.removeEventListener('scroll', onResizeOrScroll, true)
})

watch(isOpen, (open) => {
  if (open) nextTick(() => updatePanelPosition())
})

watch(
  model,
  () => {
    if (!isRangeTextFocused.value) {
      rangeTextDraft.value = rangeTextFromModel(model.value)
    }
    if (isOpen.value) syncCalendarFromModel()
  },
  { deep: true, immediate: true },
)

watch([rangeTextDraft, isOpen], () => {
  if (!isOpen.value) return
  syncOpenCalendarWithRangeTextDraft()
  nextTick(() => updatePanelPosition())
})
</script>

<style scoped>
.app-date-range-enter-active,
.app-date-range-leave-active {
  transition:
    opacity 0.15s ease,
    transform 0.15s ease;
}
.app-date-range-enter-from,
.app-date-range-leave-to {
  opacity: 0;
  transform: translateY(-6px) scale(0.98);
}
</style>
