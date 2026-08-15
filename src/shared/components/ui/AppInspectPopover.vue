<template>
  <span
    class="relative inline-flex h-full w-full"
    @mouseenter="handleEnter"
    @mouseleave="handleLeave"
  >
    <slot />

    <Teleport to="body">
      <Transition name="app-tip">
        <div
          v-if="open"
          ref="panelRef"
          role="tooltip"
          :style="panelStyle"
          class="fixed z-[100000] w-[min(92vw,20rem)] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-theme-lg dark:border-gray-700 dark:bg-gray-900"
          @mouseenter="handleEnter"
          @mouseleave="handleLeave"
        >
          <div class="flex items-center justify-between gap-2 border-b border-gray-100 px-4 py-2.5 dark:border-gray-800">
            <p class="min-w-0 truncate text-sm font-semibold text-gray-800 dark:text-white/90">
              {{ title }}
            </p>
            <span class="text-[11px] text-gray-400 dark:text-gray-500">Detalle</span>
          </div>

          <div class="max-h-[70dvh] overflow-y-auto p-4">
            <slot name="detail" />
          </div>
        </div>
      </Transition>
    </Teleport>
  </span>
</template>

<script setup lang="ts">
import { onBeforeUnmount, nextTick, ref, watch } from 'vue'

defineProps<{
  title: string
}>()

const panelRef = ref<HTMLElement>()
const open = ref(false)
const panelStyle = ref<{ top: string; left: string }>({ top: '0px', left: '0px' })

const OPEN_DELAY = 150
const CLOSE_DELAY = 120
let enterTimer: ReturnType<typeof setTimeout> | undefined
let leaveTimer: ReturnType<typeof setTimeout> | undefined

/** Referencia del cursor dentro del trigger («puntero» como ancla del tooltip). */
const cursor = ref({ x: 0, y: 0 })

const handleEnter = (event: MouseEvent) => {
  cursor.value = { x: event.clientX, y: event.clientY }
  show()
}

const handleLeave = () => hide()

const show = () => {
  window.clearTimeout(leaveTimer)
  if (open.value) return
  enterTimer = window.setTimeout(() => {
    open.value = true
    void nextTick(updatePosition)
  }, OPEN_DELAY)
}

const hide = () => {
  window.clearTimeout(enterTimer)
  leaveTimer = window.setTimeout(() => {
    open.value = false
  }, CLOSE_DELAY)
}

const updatePosition = () => {
  const panel = panelRef.value
  if (!panel) return

  const { x, y } = cursor.value
  const panelWidth = Math.min(window.innerWidth * 0.92, 320)
  const gap = 12
  const viewportPadding = 8
  const maxHeight = window.innerHeight - viewportPadding * 2
  const panelHeight = Math.min(panel.scrollHeight, maxHeight)

  let left = x + gap
  let top = y + gap

  // No cabe a la derecha => a la izquierda del puntero.
  if (left + panelWidth > window.innerWidth - viewportPadding) {
    left = Math.max(viewportPadding, x - gap - panelWidth)
  }
  left = Math.max(viewportPadding, Math.min(left, window.innerWidth - panelWidth - viewportPadding))

  const spaceBelow = window.innerHeight - y - viewportPadding
  const spaceAbove = y - viewportPadding
  // No cabe abajo => arriba del puntero.
  if (spaceBelow < panelHeight + gap && spaceAbove >= panelHeight + gap) {
    top = Math.max(viewportPadding, y - gap - panelHeight)
  } else {
    top = Math.min(y + gap, window.innerHeight - viewportPadding - panelHeight)
  }
  top = Math.max(viewportPadding, top)

  panelStyle.value = {
    top: `${top}px`,
    left: `${left}px`,
  }

  panel.style.maxHeight = `min(${maxHeight}px, ${panel.scrollHeight}px)`
}

const updateOnViewport = () => {
  if (open.value) updatePosition()
}

watch(open, (isOpen) => {
  if (isOpen) {
    window.addEventListener('resize', updateOnViewport)
    window.addEventListener('scroll', updateOnViewport, true)
  } else {
    window.removeEventListener('resize', updateOnViewport)
    window.removeEventListener('scroll', updateOnViewport, true)
  }
})

onBeforeUnmount(() => {
  window.clearTimeout(enterTimer)
  window.clearTimeout(leaveTimer)
  window.removeEventListener('resize', updateOnViewport)
  window.removeEventListener('scroll', updateOnViewport, true)
})
</script>

<style scoped>
.app-tip-enter-active,
.app-tip-leave-active {
  transition:
    opacity 0.15s ease,
    transform 0.15s ease;
}
.app-tip-enter-from,
.app-tip-leave-to {
  opacity: 0;
  transform: translateY(-4px) scale(0.98);
}
</style>