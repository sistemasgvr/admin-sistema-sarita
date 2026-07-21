<template>
  <Teleport to="body">
    <div
      v-if="modelValue"
      class="fixed inset-0 z-99999 flex items-end justify-center p-2 sm:items-center sm:p-6"
    >
      <div
        class="fixed inset-0 h-full w-full bg-gray-900/20 backdrop-blur-[2px] dark:bg-gray-950/40"
        aria-hidden="true"
        @click="onBackdropClick"
      />

      <div
        role="dialog"
        aria-modal="true"
        :aria-labelledby="titleId"
        class="relative flex max-h-[calc(100dvh-1rem)] w-full flex-col overflow-hidden rounded-2xl bg-white dark:bg-gray-900 sm:max-h-[calc(100dvh-3rem)] sm:rounded-3xl"
        :class="panelSizeClass"
        @click.stop
      >
        <div
          v-if="$slots.header || title || subtitle || showCloseButton"
          class="flex shrink-0 items-center gap-3 border-b border-gray-100 px-4 py-3 dark:border-gray-800 sm:px-5"
        >
          <div class="min-w-0 flex-1">
            <slot name="header">
              <h4
                v-if="title"
                :id="titleId"
                class="text-base font-semibold leading-snug text-gray-800 dark:text-white/90 sm:text-lg"
              >
                {{ title }}
              </h4>
              <p
                v-if="subtitle"
                class="mt-0.5 text-xs text-gray-500 dark:text-gray-400 sm:text-sm"
              >
                {{ subtitle }}
              </p>
            </slot>
          </div>

          <button
            v-if="showCloseButton"
            type="button"
            class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-600 dark:bg-white/[0.05] dark:text-gray-400 dark:hover:bg-white/[0.07] dark:hover:text-gray-300"
            aria-label="Cerrar modal"
            @click="close"
          >
            <AppIcon :name="ICONS.x" :size="18" />
          </button>
        </div>

        <div
          ref="contentScrollRef"
          :class="[
            'custom-scrollbar min-h-0 flex-1 overflow-y-auto px-4 py-3 sm:px-5 sm:py-4',
            contentClass,
          ]"
        >
          <slot />
        </div>

        <div
          v-if="$slots.footer"
          class="shrink-0 border-t border-gray-100 px-4 py-2.5 dark:border-gray-800 sm:px-5 sm:py-3"
        >
          <div
            class="flex flex-row gap-2 sm:justify-end sm:gap-2.5 [&_button]:min-h-9 [&_button]:min-w-0 [&_button]:flex-1 [&_button]:px-3 [&_button]:py-2 [&_button]:text-sm sm:[&_button]:min-h-0 sm:[&_button]:flex-none sm:[&_button]:px-3.5 sm:[&_button]:py-2 sm:[&_button]:w-auto"
          >
            <slot name="footer" />
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, nextTick, onUnmounted, ref, useId, watch } from 'vue'
import AppIcon from '@/shared/components/AppIcon.vue'
import { ICONS } from '@/shared/constants/icons'

type ModalSize = 'sm' | 'md' | 'lg' | 'xl'

interface AppModalProps {
  title?: string
  subtitle?: string
  size?: ModalSize
  showCloseButton?: boolean
  closeOnBackdrop?: boolean
  contentClass?: string
}

const props = withDefaults(defineProps<AppModalProps>(), {
  size: 'md',
  showCloseButton: true,
  closeOnBackdrop: true,
  contentClass: '',
})

const modelValue = defineModel<boolean>({ default: false })

const emit = defineEmits<{
  close: []
}>()

const titleId = useId()
const contentScrollRef = ref<HTMLElement | null>(null)

const panelSizeClass = computed(() => {
  const sizes: Record<ModalSize, string> = {
    sm: 'max-w-md',
    md: 'max-w-[700px]',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
  }

  return sizes[props.size]
})

const close = () => {
  modelValue.value = false
  emit('close')
}

const onBackdropClick = () => {
  if (props.closeOnBackdrop) {
    close()
  }
}

watch(modelValue, (isOpen) => {
  document.body.style.overflow = isOpen ? 'hidden' : ''

  if (isOpen) {
    nextTick(() => {
      contentScrollRef.value?.scrollTo({ top: 0 })
    })
  }
})

onUnmounted(() => {
  document.body.style.overflow = ''
})
</script>
