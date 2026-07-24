<template>
  <span ref="rootRef" class="relative inline-flex shrink-0">
    <button
      type="button"
      class="inline-flex h-6 w-6 items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-100 hover:text-brand-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 dark:hover:bg-white/5 dark:hover:text-brand-400"
      :aria-label="ariaLabel"
      :aria-describedby="tooltipId"
      @mouseenter="show"
      @mouseleave="hide"
      @focus="show"
      @blur="hide"
    >
      <AppIcon :name="ICONS.circleHelp" :size="14" />
    </button>

    <Teleport to="body">
      <span
        v-show="open"
        ref="tooltipRef"
        :id="tooltipId"
        role="tooltip"
        class="pointer-events-none fixed z-[100] rounded-lg border border-gray-200 bg-white px-3 py-2 text-left text-xs leading-relaxed text-gray-600 shadow-theme-lg dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
        :style="tooltipStyle"
      >
        <slot>{{ text }}</slot>
      </span>
    </Teleport>
  </span>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref, useId, type CSSProperties } from 'vue'
import AppIcon from '@/shared/components/AppIcon.vue'
import { ICONS } from '@/shared/constants/icons'

withDefaults(
  defineProps<{
    text?: string
    ariaLabel?: string
  }>(),
  {
    text: '',
    ariaLabel: 'Más información',
  },
)

const open = ref(false)
const tooltipId = useId()
const rootRef = ref<HTMLElement | null>(null)
const tooltipRef = ref<HTMLElement | null>(null)
const tooltipStyle = ref<CSSProperties>({})

const EDGE = 12
const GAP = 8
const WIDTH = 288

function updatePosition() {
  const trigger = rootRef.value
  if (!trigger) return

  const rect = trigger.getBoundingClientRect()
  const width = Math.min(WIDTH, window.innerWidth - EDGE * 2)
  let left = rect.left + rect.width / 2 - width / 2
  left = Math.max(EDGE, Math.min(left, window.innerWidth - width - EDGE))

  tooltipStyle.value = {
    left: `${left}px`,
    top: `${rect.bottom + GAP}px`,
    width: `${width}px`,
  }

  void nextTick(() => {
    const tip = tooltipRef.value
    if (!tip) return
    const tipHeight = tip.offsetHeight
    let top = rect.bottom + GAP
    if (top + tipHeight > window.innerHeight - EDGE) {
      top = Math.max(EDGE, rect.top - GAP - tipHeight)
    }
    tooltipStyle.value = {
      left: `${left}px`,
      top: `${top}px`,
      width: `${width}px`,
    }
  })
}

function onViewportChange() {
  if (open.value) updatePosition()
}

function show() {
  open.value = true
  void nextTick(updatePosition)
  window.addEventListener('scroll', onViewportChange, true)
  window.addEventListener('resize', onViewportChange)
}

function hide() {
  open.value = false
  window.removeEventListener('scroll', onViewportChange, true)
  window.removeEventListener('resize', onViewportChange)
}

onBeforeUnmount(hide)
</script>
