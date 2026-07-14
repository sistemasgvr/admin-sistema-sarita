<template>
  <div ref="rootRef" class="relative inline-flex">
    <button
      type="button"
      class="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-300 text-gray-600 transition hover:bg-gray-50 disabled:opacity-60 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
      :aria-expanded="isOpen"
      aria-haspopup="menu"
      :title="title"
      :disabled="disabled"
      @click.stop="toggle"
    >
      <AppIcon :name="ICONS.ellipsisVertical" :size="16" />
    </button>

    <Teleport to="body">
      <div
        v-if="isOpen"
        ref="menuRef"
        role="menu"
        :style="menuStyle"
        class="fixed z-[100001] min-w-[11.5rem] overflow-hidden rounded-lg border border-gray-200 bg-white py-1 shadow-theme-lg dark:border-gray-700 dark:bg-gray-900"
      >
        <button
          v-for="item in visibleItems"
          :key="item.key"
          type="button"
          role="menuitem"
          class="flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition disabled:cursor-not-allowed disabled:opacity-50"
          :class="
            item.danger
              ? 'text-error-600 hover:bg-error-50 dark:text-error-400 dark:hover:bg-error-500/10'
              : 'text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-white/5'
          "
          :disabled="item.disabled"
          @click.stop="onSelect(item)"
        >
          <AppIcon
            v-if="item.icon"
            :name="item.icon"
            :size="15"
            class="shrink-0"
          />
          <span class="min-w-0 flex-1 truncate">{{ item.label }}</span>
        </button>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import AppIcon from '@/shared/components/AppIcon.vue'
import { ICONS } from '@/shared/constants/icons'
import type { ActionMenuItem } from '@/shared/interfaces/action-menu.interface'

const props = withDefaults(
  defineProps<{
    items: ActionMenuItem[]
    title?: string
    disabled?: boolean
  }>(),
  {
    title: 'Más acciones',
    disabled: false,
  },
)

const emit = defineEmits<{
  select: [key: string]
}>()

const rootRef = ref<HTMLElement>()
const menuRef = ref<HTMLElement>()
const isOpen = ref(false)
const menuStyle = ref<{ top: string; left: string; width?: string }>({
  top: '0px',
  left: '0px',
})

const visibleItems = computed(() => props.items.filter((item) => !item.hidden))

function updatePosition() {
  const trigger = rootRef.value
  const menu = menuRef.value
  if (!trigger || !menu) return

  const rect = trigger.getBoundingClientRect()
  const menuRect = menu.getBoundingClientRect()
  const gap = 4
  const padding = 8

  let top = rect.bottom + gap
  let left = rect.right - menuRect.width

  if (top + menuRect.height > window.innerHeight - padding) {
    top = Math.max(padding, rect.top - menuRect.height - gap)
  }

  if (left < padding) left = padding
  if (left + menuRect.width > window.innerWidth - padding) {
    left = Math.max(padding, window.innerWidth - menuRect.width - padding)
  }

  menuStyle.value = {
    top: `${top}px`,
    left: `${left}px`,
  }
}

async function openMenu() {
  if (props.disabled || !visibleItems.value.length) return
  isOpen.value = true
  await nextTick()
  updatePosition()
}

function closeMenu() {
  isOpen.value = false
}

function toggle() {
  if (isOpen.value) closeMenu()
  else void openMenu()
}

function onSelect(item: ActionMenuItem) {
  if (item.disabled) return
  closeMenu()
  emit('select', item.key)
}

function onPointerDown(event: MouseEvent) {
  const target = event.target as Node
  if (rootRef.value?.contains(target) || menuRef.value?.contains(target)) return
  closeMenu()
}

watch(
  () => props.items,
  () => {
    if (isOpen.value && !visibleItems.value.length) closeMenu()
  },
)

onMounted(() => {
  document.addEventListener('mousedown', onPointerDown)
  window.addEventListener('resize', updatePosition)
  window.addEventListener('scroll', updatePosition, true)
})

onBeforeUnmount(() => {
  document.removeEventListener('mousedown', onPointerDown)
  window.removeEventListener('resize', updatePosition)
  window.removeEventListener('scroll', updatePosition, true)
})
</script>
