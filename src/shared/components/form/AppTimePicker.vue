<template>
  <AppFormField :label="label" :hint="hint" :error="error" :required="required" :disabled="disabled" :id="id">
    <template #default="{ id: fieldId }">
      <button :id="fieldId" type="button" :name="name" :disabled="disabled || readonly"
        v-bind="buttonAttrs"
        class="flex items-center justify-between gap-2 text-left"
        :class="[triggerClasses, { 'cursor-not-allowed opacity-70': readonly && !disabled }]"
        @click="openPicker">
        <span class="min-w-0 flex-1 truncate font-medium tracking-wide"
          :class="!hasValue ? 'text-gray-400 dark:text-gray-500' : 'text-gray-800 dark:text-white'">
          {{ displayValue }}
        </span>
        <span class="inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold" :class="period === 'AM'
          ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300'
          : 'bg-orange-50 text-orange-500 dark:bg-orange-900/30 dark:text-orange-300'">
          <AppIcon :name="ICONS.clock" :size="13" />
          {{ hasValue ? period : '--' }}
        </span>
      </button>

      <!-- ── Modal reloj ─────────────────────────────────────────────── -->
      <Teleport to="body">
        <Transition enter-active-class="transition duration-150 ease-out" enter-from-class="opacity-0 scale-95"
          enter-to-class="opacity-100 scale-100" leave-active-class="transition duration-100 ease-in"
          leave-from-class="opacity-100 scale-100" leave-to-class="opacity-0 scale-95">
          <div v-if="isOpen" class="fixed inset-0 z-[999999] flex items-center justify-center p-4"
            style="background-color: rgba(0,0,0,0.4); backdrop-filter: blur(4px); -webkit-backdrop-filter: blur(4px);"
            @mousedown.self="cancel">
            <div class="w-72 overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-gray-900">

              <!-- ── Display de hora ──────────────────────────────── -->
              <div class="px-6 pb-4 pt-6">
                <p class="mb-3 text-[10px] font-semibold uppercase tracking-widest text-gray-800 dark:text-gray-300">
                  Seleccionar hora
                </p>

                <div class="flex items-center">

                  <!-- Hora -->
                  <div class="relative">
                    <input v-if="editMode === 'hour'" ref="hourInputEl" type="text" inputmode="numeric" maxlength="2"
                      class="w-[78px] rounded-xl py-1.5 text-center text-[42px] font-light leading-none outline-none bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300"
                      :value="dHour" @input="onHourInput" @blur="commitHour"
                      @keydown.enter.prevent="commitHour(); enterEdit('minute')"
                      @keydown.tab.prevent="commitHour(); enterEdit('minute')" />
                    <button v-else type="button"
                      class="w-[78px] rounded-xl py-1.5 text-center text-[42px] font-light leading-none transition-colors"
                      :class="mode === 'hour'
                        ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300'
                        : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'"
                      @click="enterEdit('hour')">{{ dHour }}</button>
                  </div>

                  <span class="mx-1 text-3xl font-light text-gray-400">:</span>

                  <!-- Minuto -->
                  <div class="relative">
                    <input v-if="editMode === 'minute'" ref="minInputEl" type="text" inputmode="numeric" maxlength="2"
                      class="w-[78px] rounded-xl py-1.5 text-center text-[42px] font-light leading-none outline-none bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300"
                      :value="dMinute" @input="onMinuteInput" @blur="commitMinute"
                      @keydown.enter.prevent="commitMinute"
                      @keydown.tab.prevent="commitMinute(); enterEdit('hour')" />
                    <button v-else type="button"
                      class="w-[78px] rounded-xl py-1.5 text-center text-[42px] font-light leading-none transition-colors"
                      :class="mode === 'minute'
                        ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300'
                        : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'"
                      @click="enterEdit('minute')">{{ dMinute }}</button>
                  </div>

                  <!-- AM / PM -->
                  <div class="ml-auto flex flex-col gap-1">
                    <button v-for="p in (['AM', 'PM'] as const)" :key="p" type="button"
                      class="rounded-lg border px-2.5 py-0.5 text-xs font-semibold transition-colors" :class="dPeriod === p
                        ? 'border-blue-400 bg-blue-50 text-blue-600 dark:border-blue-500 dark:bg-blue-900/40 dark:text-blue-300'
                        : 'border-gray-200 text-gray-400 hover:border-gray-300 dark:border-gray-700 dark:text-gray-500'"
                      @click="dPeriod = p">{{ p }}</button>
                  </div>
                </div>
              </div>

              <!-- ── Cara del reloj ───────────────────────────────── -->
              <div class="flex justify-center bg-gray-50 px-5 py-4 dark:bg-gray-800/60">
                <svg ref="clockSvg" viewBox="0 0 220 220" class="w-full max-w-[220px] select-none"
                  style="touch-action: none; cursor: crosshair" @mousedown.prevent="startDrag" @mousemove="onMouseMove"
                  @mouseup="stopDrag" @mouseleave="stopDrag" @touchstart.prevent="onTouchStart"
                  @touchmove.prevent="onTouchMove" @touchend="stopDrag">
                  <!-- Fondo -->
                  <circle cx="110" cy="110" r="104" fill="#E5E7EB" />

                  <!-- ── Marcas del reloj (ticks) ─────────────────── -->
                  <template v-if="mode === 'hour'">
                    <line v-for="h in 12" :key="`tick-h-${h}`" :x1="clockXY(h, 12, 102).x" :y1="clockXY(h, 12, 102).y"
                      :x2="clockXY(h, 12, 94).x" :y2="clockXY(h, 12, 94).y" stroke="#9CA3AF" stroke-width="1.5"
                      stroke-linecap="round" style="pointer-events: none" />
                  </template>
                  <template v-else>
                    <line v-for="m in 60" :key="`tick-m-${m}`" :x1="clockXY(m, 60, 102).x" :y1="clockXY(m, 60, 102).y"
                      :x2="clockXY(m, 60, m % 5 === 0 ? 92 : 96).x" :y2="clockXY(m, 60, m % 5 === 0 ? 92 : 96).y"
                      :stroke="m % 5 === 0 ? '#6B7280' : '#D1D5DB'" :stroke-width="m % 5 === 0 ? 2 : 1"
                      stroke-linecap="round" style="pointer-events: none" />
                  </template>

                  <!-- Manecilla -->
                  <line x1="110" y1="110" :x2="handEnd.x" :y2="handEnd.y" stroke="#3a58ed" stroke-width="2"
                    stroke-linecap="round" style="pointer-events: none" />

                  <!-- Punto central -->
                  <circle cx="110" cy="110" r="4" fill="#3a58ed" style="pointer-events: none" />

                  <!-- ── Modo HORAS ────────────────────────────────── -->
                  <template v-if="mode === 'hour'">
                    <g v-for="h in 12" :key="`h-${h}`" style="cursor: pointer" @mousedown.stop.prevent="pickHour(h)"
                      @touchstart.stop.prevent="pickHour(h)">
                      <circle :cx="clockXY(h, 12, NUM_R).x" :cy="clockXY(h, 12, NUM_R).y" r="17"
                        :fill="Number(dHour) === h ? '#3a58ed' : 'transparent'" />
                      <text :x="clockXY(h, 12, NUM_R).x" :y="clockXY(h, 12, NUM_R).y" text-anchor="middle"
                        dominant-baseline="central" :fill="Number(dHour) === h ? 'white' : '#374151'" font-size="13"
                        font-weight="500">{{ h }}</text>
                    </g>
                  </template>

                  <!-- ── Modo MINUTOS ─────────────────────────────── -->
                  <template v-else>
                    <!-- Etiquetas en múltiplos de 5 -->
                    <g v-for="step in minuteSteps" :key="`ms-${step}`" style="cursor: pointer"
                      @mousedown.stop.prevent="pickMinute(step)" @touchstart.stop.prevent="pickMinute(step)">
                      <circle :cx="clockXY(step, 60, NUM_R).x" :cy="clockXY(step, 60, NUM_R).y" r="15"
                        :fill="Number(dMinute) === step ? '#3a58ed' : 'transparent'" />
                      <text :x="clockXY(step, 60, NUM_R).x" :y="clockXY(step, 60, NUM_R).y" text-anchor="middle"
                        dominant-baseline="central" :fill="Number(dMinute) === step ? 'white' : '#374151'" font-size="11"
                        font-weight="500">{{ String(step).padStart(2, '0') }}</text>
                    </g>

                    <!-- Círculo del seleccionado si no es múltiplo de 5 -->
                    <template v-if="Number(dMinute) % 5 !== 0">
                      <circle :cx="handEnd.x" :cy="handEnd.y" r="15" fill="#3a58ed" style="pointer-events: none" />
                      <text :x="handEnd.x" :y="handEnd.y" text-anchor="middle" dominant-baseline="central" fill="white"
                        font-size="11" font-weight="600" style="pointer-events: none">{{ dMinute }}</text>
                    </template>
                  </template>
                </svg>
              </div>

              <!-- ── Footer ──────────────────────────────────────── -->
              <div class="flex items-center justify-end gap-1 px-4 py-3">
                <button type="button"
                  class="rounded-lg px-4 py-2 text-sm font-semibold text-blue-600 transition-colors hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/30"
                  @click="cancel">CANCELAR</button>
                <button type="button"
                  class="rounded-lg px-4 py-2 text-sm font-semibold text-blue-600 transition-colors hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/30"
                  @click="confirm">OK</button>
              </div>

            </div>
          </div>
        </Transition>
      </Teleport>
    </template>
  </AppFormField>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, useAttrs, watch } from 'vue'
import AppFormField from '@/shared/components/form/AppFormField.vue'
import AppIcon from '@/shared/components/AppIcon.vue'
import { useFormControlClasses } from '@/shared/composables/useFormControlClasses'
import { ICONS } from '@/shared/constants/icons'
import type { FormControlState } from '@/shared/interfaces/form.interface'

defineOptions({
  inheritAttrs: false,
})

interface AppTimePickerProps {
  label?: string
  hint?: string
  error?: string
  required?: boolean
  disabled?: boolean
  readonly?: boolean
  name?: string
  id?: string
  state?: FormControlState
}

const props = withDefaults(defineProps<AppTimePickerProps>(), {
  state: 'default',
})

const model = defineModel<string | null>({ default: '' })

const attrs = useAttrs()
const clockSvg = ref<SVGSVGElement | null>(null)
const hourInputEl = ref<HTMLInputElement | null>(null)
const minInputEl = ref<HTMLInputElement | null>(null)

const isOpen = ref(false)
const mode = ref<'hour' | 'minute'>('hour')
const editMode = ref<'none' | 'hour' | 'minute'>('none')

// Estado estable (trigger)
const hour12 = ref('12')
const minute = ref('00')
const period = ref<'AM' | 'PM'>('AM')

// Estado draft (dentro del modal)
const dHour = ref('12')
const dMinute = ref('00')
const dPeriod = ref<'AM' | 'PM'>('AM')

let isDragging = false

// ─── geometría ───────────────────────────────────────────────────────────────
const CX = 110
const CY = 110
const NUM_R = 78
const minuteSteps = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55]

/** Coordenada en el círculo del reloj */
const clockXY = (index: number, total: number, r: number) => {
  const a = (index / total) * 2 * Math.PI - Math.PI / 2
  return { x: CX + r * Math.cos(a), y: CY + r * Math.sin(a) }
}

const handEnd = computed(() =>
  mode.value === 'hour'
    ? clockXY(Number(dHour.value), 12, NUM_R)
    : clockXY(Number(dMinute.value), 60, NUM_R),
)

// ─── utilidades de tiempo ────────────────────────────────────────────────────
const validTime = /^([01]\d|2[0-3]):([0-5]\d)$/

const normalizeHHmm = (v: string | null | undefined): string => {
  if (!v) return ''
  const s = String(v).trim()
  const part = s.includes('T') ? (s.split('T')[1] ?? '') : s
  const hhmm = part.slice(0, 5)
  return validTime.test(hhmm) ? hhmm : ''
}

const to24h = (h: string, m: string, p: 'AM' | 'PM'): string => {
  let hh = Number(h)
  if (p === 'AM' && hh === 12) hh = 0
  else if (p === 'PM' && hh !== 12) hh += 12
  return `${String(hh).padStart(2, '0')}:${m}`
}

const applyModel = (v: string | null | undefined) => {
  const hhmm = normalizeHHmm(v)
  if (!hhmm) return
  const hh = Number(hhmm.slice(0, 2))
  minute.value = hhmm.slice(3, 5)
  period.value = hh >= 12 ? 'PM' : 'AM'
  let h = hh % 12
  if (h === 0) h = 12
  hour12.value = String(h).padStart(2, '0')
}

watch(
  model,
  (newVal) => {
    applyModel(newVal)
  },
  { immediate: true },
)

// ─── computed trigger ────────────────────────────────────────────────────────
const hasValue = computed(() => !!normalizeHHmm(model.value))
const displayValue = computed(() =>
  hasValue.value ? `${hour12.value}:${minute.value} ${period.value}` : '--:-- --',
)

const controlState = computed<FormControlState>(() => (props.error ? 'error' : props.state))
const triggerClasses = useFormControlClasses(controlState)

const buttonAttrs = computed(() => {
  const { class: _class, style: _style, ...rest } = attrs
  return rest
})

// ─── abrir / confirmar / cancelar ────────────────────────────────────────────
const openPicker = () => {
  if (props.disabled || props.readonly) return
  dHour.value = hour12.value
  dMinute.value = minute.value
  dPeriod.value = period.value
  mode.value = 'hour'
  editMode.value = 'none'
  isOpen.value = true
}

const notifyBlur = () => {
  const onBlur = attrs.onBlur
  if (typeof onBlur === 'function') {
    onBlur(new FocusEvent('blur'))
  }
}

const confirm = () => {
  const value = to24h(dHour.value, dMinute.value, dPeriod.value)
  model.value = value
  applyModel(value)
  isOpen.value = false
  notifyBlur()
}

const cancel = () => {
  isOpen.value = false
  notifyBlur()
}

// ─── edición por teclado ─────────────────────────────────────────────────────
const enterEdit = async (field: 'hour' | 'minute') => {
  editMode.value = field
  mode.value = field
  await nextTick()
  if (field === 'hour') {
    hourInputEl.value?.select()
  } else {
    minInputEl.value?.select()
  }
}

const onHourInput = (e: Event) => {
  const raw = (e.target as HTMLInputElement).value.replace(/\D/g, '').slice(0, 2)
  ;(e.target as HTMLInputElement).value = raw
  const n = Number(raw)
  if (raw.length === 2 || (n >= 2 && n <= 9)) {
    const clamped = Math.max(1, Math.min(12, n || 12))
    dHour.value = String(clamped).padStart(2, '0')
  }
}

const commitHour = () => {
  const n = Number(dHour.value)
  dHour.value = String(Math.max(1, Math.min(12, n || 12))).padStart(2, '0')
  editMode.value = 'none'
}

const onMinuteInput = (e: Event) => {
  const raw = (e.target as HTMLInputElement).value.replace(/\D/g, '').slice(0, 2)
  ;(e.target as HTMLInputElement).value = raw
  const n = Number(raw)
  if (raw.length === 2 || n > 5) {
    const clamped = Math.max(0, Math.min(59, n))
    dMinute.value = String(clamped).padStart(2, '0')
  }
}

const commitMinute = () => {
  const n = Number(dMinute.value)
  dMinute.value = String(Math.max(0, Math.min(59, n))).padStart(2, '0')
  editMode.value = 'none'
}

// ─── selección directa ───────────────────────────────────────────────────────
const pickHour = (h: number) => {
  dHour.value = String(h).padStart(2, '0')
  editMode.value = 'none'
  setTimeout(() => {
    mode.value = 'minute'
  }, 180)
}

const pickMinute = (m: number) => {
  dMinute.value = String(m).padStart(2, '0')
  editMode.value = 'none'
}

// ─── drag en el SVG ──────────────────────────────────────────────────────────
const getAngle = (clientX: number, clientY: number): number => {
  const svg = clockSvg.value
  if (!svg) return 0
  const rect = svg.getBoundingClientRect()
  const sx = 220 / rect.width
  const sy = 220 / rect.height
  return Math.atan2((clientY - rect.top) * sy - CY, (clientX - rect.left) * sx - CX)
}

const applyAngle = (angle: number) => {
  let fromTop = angle + Math.PI / 2
  if (fromTop < 0) fromTop += 2 * Math.PI

  if (mode.value === 'hour') {
    let h = Math.round(fromTop / ((2 * Math.PI) / 12))
    if (h <= 0 || h > 12) h = 12
    dHour.value = String(h).padStart(2, '0')
  } else {
    let m = Math.round(fromTop / ((2 * Math.PI) / 60))
    if (m >= 60) m = 0
    dMinute.value = String(m).padStart(2, '0')
  }
}

const startDrag = (e: MouseEvent) => {
  editMode.value = 'none'
  isDragging = true
  applyAngle(getAngle(e.clientX, e.clientY))
}
const onMouseMove = (e: MouseEvent) => {
  if (!isDragging) return
  applyAngle(getAngle(e.clientX, e.clientY))
}
const stopDrag = () => {
  if (isDragging && mode.value === 'hour') {
    setTimeout(() => {
      mode.value = 'minute'
    }, 80)
  }
  isDragging = false
}
const onTouchStart = (e: TouchEvent) => {
  const t = e.touches[0]
  if (!t) return
  editMode.value = 'none'
  isDragging = true
  applyAngle(getAngle(t.clientX, t.clientY))
}
const onTouchMove = (e: TouchEvent) => {
  const t = e.touches[0]
  if (!t || !isDragging) return
  applyAngle(getAngle(t.clientX, t.clientY))
}
</script>
