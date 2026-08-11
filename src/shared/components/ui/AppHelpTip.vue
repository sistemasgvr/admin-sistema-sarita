<template>
  <span ref="rootRef" class="relative inline-flex shrink-0">
    <button
      type="button"
      class="inline-flex h-6 w-6 items-center justify-center rounded-full transition focus-visible:outline-none focus-visible:ring-2"
      :class="toneClasses.button"
      :aria-label="ariaLabel"
      :aria-describedby="tooltipId"
      @mouseenter="show"
      @mouseleave="hide"
      @focus="show"
      @blur="hide"
    >
      <AppIcon :name="toneClasses.icon" :size="14" />
    </button>

    <Teleport to="body">
      <span
        v-show="open"
        ref="tooltipRef"
        :id="tooltipId"
        role="tooltip"
        class="pointer-events-none fixed z-[100000] rounded-lg border px-3 py-2 text-left text-xs font-medium leading-relaxed shadow-theme-lg"
        :class="toneClasses.panel"
        :style="tooltipStyle"
      >
        <slot>{{ text }}</slot>
      </span>
    </Teleport>
  </span>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, useId, type CSSProperties } from 'vue'
import AppIcon from '@/shared/components/AppIcon.vue'
import { ICONS } from '@/shared/constants/icons'

type HelpTipTone = 'default' | 'warning' | 'error'
type HelpTipPlacement = 'auto' | 'top' | 'bottom'

const props = withDefaults(
  defineProps<{
    text?: string
    ariaLabel?: string
    /** default = ayuda; warning = aviso ámbar; error = bloqueo / incongruencia */
    tone?: HelpTipTone
    /** Preferencia de anclaje. `auto` elige arriba si no cabe abajo. */
    placement?: HelpTipPlacement
  }>(),
  {
    text: '',
    ariaLabel: 'Más información',
    tone: 'default',
    placement: 'auto',
  },
)

const toneClasses = computed(() => {
  if (props.tone === 'error') {
    return {
      icon: ICONS.alertCircle,
      button:
        'text-error-500 hover:bg-error-50 hover:text-error-600 focus-visible:ring-error-500/40 dark:text-error-400 dark:hover:bg-error-500/10 dark:hover:text-error-300',
      panel:
        'border-error-300 bg-white text-error-700 dark:border-error-500/50 dark:bg-gray-900 dark:text-error-300',
    }
  }
  if (props.tone === 'warning') {
    return {
      icon: ICONS.alertCircle,
      button:
        'text-amber-500 hover:bg-amber-50 hover:text-amber-600 focus-visible:ring-amber-500/40 dark:text-amber-400 dark:hover:bg-amber-500/10 dark:hover:text-amber-300',
      panel:
        'border-amber-300 bg-white text-amber-800 dark:border-amber-500/50 dark:bg-gray-900 dark:text-amber-300',
    }
  }
  return {
    icon: ICONS.circleHelp,
    button:
      'text-gray-400 hover:bg-gray-100 hover:text-brand-500 focus-visible:ring-brand-500/40 dark:hover:bg-white/5 dark:hover:text-brand-400',
    panel:
      'border-gray-200 bg-white text-gray-600 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300',
  }
})

const open = ref(false)
const tooltipId = useId()
const rootRef = ref<HTMLElement | null>(null)
const tooltipRef = ref<HTMLElement | null>(null)
const tooltipStyle = ref<CSSProperties>({
  left: '0px',
  top: '0px',
  width: '0px',
  visibility: 'hidden',
})

const EDGE = 12
const GAP = 8
const WIDTH = 288

function placeTooltip(rect: DOMRect, tipHeight: number, width: number) {
  let left = rect.left + rect.width / 2 - width / 2
  left = Math.max(EDGE, Math.min(left, window.innerWidth - width - EDGE))

  const spaceBelow = window.innerHeight - rect.bottom - EDGE
  const spaceAbove = rect.top - EDGE
  let placeTop = props.placement === 'top'
  if (props.placement === 'auto') {
    placeTop = tipHeight + GAP > spaceBelow && spaceAbove >= tipHeight + GAP
  } else if (props.placement === 'bottom') {
    placeTop = false
  }

  // Si forzó top pero no cabe, cae abajo (y viceversa).
  if (placeTop && spaceAbove < tipHeight + GAP && spaceBelow >= tipHeight + GAP) {
    placeTop = false
  }
  if (!placeTop && spaceBelow < tipHeight + GAP && spaceAbove >= tipHeight + GAP) {
    placeTop = true
  }

  const top = placeTop
    ? Math.max(EDGE, rect.top - GAP - tipHeight)
    : Math.min(rect.bottom + GAP, window.innerHeight - EDGE - tipHeight)

  tooltipStyle.value = {
    left: `${left}px`,
    top: `${top}px`,
    width: `${width}px`,
    visibility: 'visible',
  }
}

function updatePosition() {
  const trigger = rootRef.value
  const tip = tooltipRef.value
  if (!trigger || !tip) return

  const rect = trigger.getBoundingClientRect()
  const width = Math.min(WIDTH, window.innerWidth - EDGE * 2)

  // Medir fuera de pantalla para no parpadear abajo.
  tooltipStyle.value = {
    left: `-${width}px`,
    top: '0px',
    width: `${width}px`,
    visibility: 'hidden',
  }

  void nextTick(() => {
    const tipHeight = tip.offsetHeight || 48
    placeTooltip(rect, tipHeight, width)
  })
}

function onViewportChange() {
  if (open.value) updatePosition()
}

function show() {
  open.value = true
  tooltipStyle.value = {
    ...tooltipStyle.value,
    visibility: 'hidden',
  }
  void nextTick(updatePosition)
  window.addEventListener('scroll', onViewportChange, true)
  window.addEventListener('resize', onViewportChange)
}

function hide() {
  open.value = false
  tooltipStyle.value = {
    ...tooltipStyle.value,
    visibility: 'hidden',
  }
  window.removeEventListener('scroll', onViewportChange, true)
  window.removeEventListener('resize', onViewportChange)
}

onBeforeUnmount(hide)
</script>
