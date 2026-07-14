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
          class="flex shrink-0 items-start gap-3 border-b border-gray-100 px-4 pb-2.5 pt-3 dark:border-gray-800 sm:px-4 sm:pb-4 sm:pt-4 lg:px-8 lg:pb-5 lg:pt-8"
        >
          <div class="min-w-0 flex-1">
            <slot name="header">
              <h4
                v-if="title"
                :id="titleId"
                class="text-base font-semibold leading-snug text-gray-800 dark:text-white/90 sm:mb-0.5 sm:text-xl lg:text-2xl"
              >
                {{ title }}
              </h4>
              <p
                v-if="subtitle"
                class="mt-0.5 hidden text-sm text-gray-500 dark:text-gray-400 sm:block"
              >
                {{ subtitle }}
              </p>
            </slot>
          </div>

          <button
            v-if="showCloseButton"
            type="button"
            class="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-600 dark:bg-white/[0.05] dark:text-gray-400 dark:hover:bg-white/[0.07] dark:hover:text-gray-300 sm:h-9 sm:w-9 lg:h-10 lg:w-10"
            aria-label="Cerrar modal"
            @click="close"
          >
            <AppIcon :name="ICONS.x" :size="18" class="sm:hidden" />
            <AppIcon :name="ICONS.x" :size="20" class="hidden sm:block lg:hidden" />
            <AppIcon :name="ICONS.x" :size="22" class="hidden lg:block" />
          </button>
        </div>

        <div
          ref="contentScrollRef"
          :class="[
            'custom-scrollbar min-h-0 flex-1 overflow-y-auto px-4 sm:px-4 lg:px-8',
            $slots.header || title || subtitle || showCloseButton
              ? 'py-3 sm:py-5 lg:py-6'
              : 'py-3 sm:py-4 lg:py-8',
            contentClass,
          ]"
        >
          <slot />
        </div>

        <div
          v-if="$slots.footer"
          class="shrink-0 border-t border-gray-100 px-4 py-3 dark:border-gray-800 sm:px-4 sm:py-4 lg:px-8 lg:py-6"
        >
          <div
            class="flex flex-row gap-2 sm:flex-row sm:justify-end sm:gap-3 [&_button]:min-h-9 [&_button]:min-w-0 [&_button]:flex-1 [&_button]:px-3 [&_button]:py-2 [&_button]:text-sm sm:[&_button]:min-h-0 sm:[&_button]:flex-none sm:[&_button]:px-4 sm:[&_button]:py-2.5 sm:[&_button]:w-auto"
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
