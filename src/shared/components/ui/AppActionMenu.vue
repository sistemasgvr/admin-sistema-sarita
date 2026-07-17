<template>
  <div ref="rootRef" class="relative inline-flex">
    <button
      type="button"
      class="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-300 text-gray-600 transition hover:bg-gray-50 disabled:opacity-60 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
      :aria-expanded="isOpen"
      aria-haspopup="menu"
      :title="title"
      :disabled="disabled || pendingKey !== null"
      @click.stop="toggle"
    >
      <AppIcon
        :name="pendingKey ? ICONS.loader : ICONS.ellipsisVertical"
        :size="16"
        :class="{ 'animate-spin': pendingKey !== null }"
      />
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
          :disabled="isItemDisabled(item)"
          @click.stop="onSelect(item)"
        >
          <AppIcon
            v-if="isItemLoading(item) || item.icon"
            :name="isItemLoading(item) ? ICONS.loader : (item.icon ?? ICONS.loader)"
            :size="15"
            class="shrink-0"
            :class="{ 'animate-spin': isItemLoading(item) }"
          />
          <span class="min-w-0 flex-1 truncate">
            {{ isItemLoading(item) ? 'Procesando...' : item.label }}
          </span>
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
    /** Si retorna Promise, el menú queda abierto con loading solo en esa key. */
    execute?: (key: string) => void | Promise<unknown>
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
/** Key de la única acción en curso. El loading nunca se comparte entre ítems. */
const pendingKey = ref<string | null>(null)
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
  if (props.disabled || pendingKey.value || !visibleItems.value.length) return
  isOpen.value = true
  await nextTick()
  updatePosition()
}

function closeMenu(force = false) {
  if (pendingKey.value && !force) return
  isOpen.value = false
}

function toggle() {
  if (pendingKey.value) return
  if (isOpen.value) closeMenu()
  else void openMenu()
}

function isItemLoading(item: ActionMenuItem) {
  return pendingKey.value === item.key
}

function isItemDisabled(item: ActionMenuItem) {
  if (pendingKey.value) return true
  return item.disabled === true
}

function isThenable(value: unknown): value is PromiseLike<unknown> {
  return (
    value != null &&
    (typeof value === 'object' || typeof value === 'function') &&
    typeof (value as PromiseLike<unknown>).then === 'function'
  )
}

async function runPendingAction(key: string, task: PromiseLike<unknown>) {
  pendingKey.value = key
  await nextTick()
  updatePosition()

  try {
    await task
  } catch {
    // La acción consumidora muestra su propia notificación de error.
  } finally {
    pendingKey.value = null
    closeMenu(true)
  }
}

async function onSelect(item: ActionMenuItem) {
  if (isItemDisabled(item) || pendingKey.value) return

  if (props.execute) {
    // Marcar loading de esta key antes de ejecutar, para no depender de flags del padre.
    const result = props.execute(item.key)

    if (isThenable(result)) {
      await runPendingAction(item.key, result)
      return
    }

    closeMenu()
    return
  }

  emit('select', item.key)
  closeMenu()
}

function onPointerDown(event: MouseEvent) {
  const target = event.target as Node
  if (rootRef.value?.contains(target) || menuRef.value?.contains(target)) return
  closeMenu()
}

watch(
  () => props.items,
  () => {
    if (!isOpen.value) return
    if (!visibleItems.value.length && !pendingKey.value) closeMenu()
  },
  { deep: true },
)

watch(pendingKey, async (key) => {
  if (key && isOpen.value) {
    await nextTick()
    updatePosition()
  }
})

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
