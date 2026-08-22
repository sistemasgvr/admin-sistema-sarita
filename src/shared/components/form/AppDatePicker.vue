<template>
  <AppFormField :label="label" :hint="hint" :error="error" :required="required" :optional="optional" :disabled="disabled" :id="id">
    <template #default="{ id: fieldId }">
      <div ref="triggerWrapRef" class="relative">
        <div
          class="flex h-11 w-full items-stretch overflow-hidden rounded-lg bg-transparent shadow-theme-xs transition-colors focus-within:border-brand-300 focus-within:outline-hidden focus-within:ring-3 focus-within:ring-brand-500/10 dark:focus-within:border-brand-800"
          :class="triggerClasses"
        >
          <input
            :id="fieldId"
            type="text"
            :value="dateTextDraft"
            :name="name"
            inputmode="numeric"
            autocomplete="off"
            maxlength="10"
            :placeholder="placeholder"
            :disabled="disabled"
            class="min-w-0 flex-1 border-0 bg-transparent px-3 py-2.5 text-sm text-gray-800 outline-none placeholder:text-gray-400 focus:ring-0 dark:text-white/90 dark:placeholder:text-white/30"
            v-bind="inputAttrs"
            @input="onDateTextInput"
            @focus="isDateTextFocused = true"
            @blur="onDateTextBlur"
            @keydown.enter.prevent="commitDateTextFromInput"
          />
          <button
            type="button"
            class="flex shrink-0 items-center justify-center border-l border-gray-200 px-3 dark:border-gray-600"
            :class="disabled ? 'cursor-not-allowed opacity-60' : 'hover:bg-gray-50 dark:hover:bg-gray-800/80'"
            :disabled="disabled"
            aria-label="Abrir calendario"
            @click="toggleOpen"
          >
            <AppIcon :name="ICONS.calendar" :size="20" class="shrink-0 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <Teleport to="body">
          <Transition name="app-date-picker">
            <div v-if="isOpen" ref="panelRef"
              class="fixed z-[100002] min-w-[280px] max-w-[min(100vw-2rem,320px)] overflow-y-auto overflow-x-hidden rounded-xl border border-gray-200 bg-white shadow-theme-lg dark:border-gray-700 dark:bg-gray-900"
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
                    <div v-else class="flex h-9 w-full items-center justify-center">
                      <button type="button" :disabled="isDayDisabled(day)"
                        class="flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-medium transition-colors"
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
                  @click="clearDate">
                  Borrar
                </button>
                <button type="button"
                  class="rounded-md px-2 py-1 text-xs font-semibold text-brand-600 transition-colors hover:bg-brand-50 enabled:hover:text-brand-700 disabled:cursor-not-allowed disabled:opacity-40 dark:text-brand-400 dark:hover:bg-brand-900/20 dark:hover:text-brand-300"
                  :disabled="isDayDisabled(new Date())" @click="selectToday">
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
  formatDateInputMasked,
  dateInputDigitIndexAtCursor,
  cursorPositionForDateFormatted,
  parseDdMmYyyyStringToDate,
  parseDateSegmentForCalendarNav,
} from '@/shared/utils/dateMask'

type CalendarView = 'day' | 'month' | 'year'

defineOptions({
  inheritAttrs: false,
})

interface AppDatePickerProps {
  label?: string
  placeholder?: string
  disabled?: boolean
  error?: string
  hint?: string
  required?: boolean
  optional?: boolean
  name?: string
  id?: string
  min?: number | string
  max?: number | string
}

const props = withDefaults(defineProps<AppDatePickerProps>(), {
  placeholder: 'dd/mm/aaaa',
})

/** v-model en formato ISO (yyyy-mm-dd), igual que AppInput type="date". */
const model = defineModel<string>({ default: '' })

const attrs = useAttrs()
const triggerWrapRef = ref<HTMLElement | null>(null)
const panelRef = ref<HTMLElement | null>(null)
const panelStyle = ref<Record<string, string>>({})
const isOpen = ref(false)
const dateTextDraft = ref('')
const isDateTextFocused = ref(false)
const calendarView = ref<CalendarView>('day')
const calendarMonth = ref(new Date().getMonth())
const calendarYear = ref(new Date().getFullYear())
const decadeStart = ref(Math.floor(new Date().getFullYear() / 12) * 12)

const inputAttrs = computed(() => {
  const { class: _class, style: _style, ...rest } = attrs
  return rest
})

const selectedDate = computed(() => (model.value ? parseYMD(model.value) : null))

function dateTextFromModel(ymd: string): string {
  return displayDDMMYYYY(ymd)
}

function notifyBlur() {
  const onBlur = attrs.onBlur
  if (typeof onBlur === 'function') {
    onBlur(new FocusEvent('blur'))
  }
}

function commitDateTextFromInput() {
  const t = dateTextDraft.value.trim()
  if (!t) {
    model.value = ''
    dateTextDraft.value = ''
    return
  }
  const dt = parseDdMmYyyyStringToDate(t)
  if (!dt || isDayDisabled(dt)) {
    dateTextDraft.value = dateTextFromModel(model.value)
    return
  }
  model.value = formatYMD(dt)
  dateTextDraft.value = dateTextFromModel(model.value)
}

function onDateTextInput(e: Event) {
  const el = e.target as HTMLInputElement
  const raw = el.value
  const sel = el.selectionStart ?? raw.length
  const digitIdx = dateInputDigitIndexAtCursor(raw, sel)
  const formatted = formatDateInputMasked(raw)
  dateTextDraft.value = formatted
  nextTick(() => {
    const pos = cursorPositionForDateFormatted(formatted, digitIdx)
    el.setSelectionRange(pos, pos)
  })
}

function onDateTextBlur() {
  commitDateTextFromInput()
  isDateTextFocused.value = false
  notifyBlur()
}

/** Con el panel abierto: alinea mes/año del calendario con lo que se está tipeando. */
function syncOpenCalendarWithDateTextDraft() {
  if (!isOpen.value) return
  const nav = parseDateSegmentForCalendarNav(dateTextDraft.value)
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

function dayButtonClass(day: Date): string {
  const disabled = isDayDisabled(day)
  const selected = selectedDate.value && isSameDay(day, selectedDate.value)
  const today = isToday(day)

  if (selected) {
    return disabled
      ? 'cursor-not-allowed bg-brand-200 text-brand-700 dark:bg-brand-800/45 dark:text-brand-200'
      : 'bg-brand-600 text-white shadow-sm hover:bg-brand-700'
  }
  if (disabled) return 'cursor-not-allowed text-gray-300 dark:text-gray-600'
  if (today) return 'ring-1 ring-inset ring-brand-500 text-brand-700 dark:text-brand-300'
  return 'text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700/60'
}

function onSelectDay(day: Date) {
  if (isDayDisabled(day)) return
  const ymd = formatYMD(day)
  model.value = ymd
  dateTextDraft.value = dateTextFromModel(ymd)
  isOpen.value = false
  notifyBlur()
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
  const d = selectedDate.value ?? new Date()
  calendarMonth.value = d.getMonth()
  calendarYear.value = d.getFullYear()
  decadeStart.value = Math.floor(d.getFullYear() / 12) * 12
}

function toggleOpen() {
  if (props.disabled) return
  const opening = !isOpen.value
  isOpen.value = opening
  if (isOpen.value) {
    calendarView.value = 'day'
    syncCalendarFromModel()
  } else {
    notifyBlur()
  }
}

function clearDate() {
  model.value = ''
  dateTextDraft.value = ''
  isOpen.value = false
  notifyBlur()
}

function selectToday() {
  const t = new Date()
  if (isDayDisabled(t)) return
  onSelectDay(t)
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
  const panelWidth = Math.min(320, window.innerWidth - viewportPadding * 2)
  const estimatedHeight = 360

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
    if (!isDateTextFocused.value) {
      dateTextDraft.value = dateTextFromModel(model.value)
    }
    if (isOpen.value) syncCalendarFromModel()
  },
  { immediate: true },
)

watch([dateTextDraft, isOpen], () => {
  if (!isOpen.value) return
  syncOpenCalendarWithDateTextDraft()
  nextTick(() => updatePanelPosition())
})
</script>

<style scoped>
.app-date-picker-enter-active,
.app-date-picker-leave-active {
  transition:
    opacity 0.15s ease,
    transform 0.15s ease;
}
.app-date-picker-enter-from,
.app-date-picker-leave-to {
  opacity: 0;
  transform: translateY(-6px) scale(0.98);
}
</style>
