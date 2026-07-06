<template>
  <Teleport to="body">
    <div
      v-if="modelValue"
      class="fixed inset-0 z-99999 flex items-center justify-center p-4 sm:p-6"
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
        class="relative flex max-h-[calc(100dvh-2rem)] w-full flex-col overflow-hidden rounded-3xl bg-white dark:bg-gray-900"
        :class="panelSizeClass"
        @click.stop
      >
        <button
          v-if="showCloseButton"
          type="button"
          class="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-600 dark:bg-white/[0.05] dark:text-gray-400 dark:hover:bg-white/[0.07] dark:hover:text-gray-300 lg:right-5 lg:top-5 lg:h-11 lg:w-11"
          aria-label="Cerrar modal"
          @click="close"
        >
          <AppIcon :name="ICONS.x" :size="22" />
        </button>

        <div
          v-if="$slots.header || title || subtitle"
          class="shrink-0 border-b border-gray-100 px-4 pb-4 pt-4 dark:border-gray-800 lg:px-8 lg:pb-5 lg:pt-8"
        >
          <div class="px-1 pr-12 lg:pr-14">
            <slot name="header">
              <h4
                :id="titleId"
                class="mb-1 text-xl font-semibold text-gray-800 dark:text-white/90 lg:text-2xl"
              >
                {{ title }}
              </h4>
              <p v-if="subtitle" class="text-sm text-gray-500 dark:text-gray-400">
                {{ subtitle }}
              </p>
            </slot>
          </div>
        </div>

        <div
          ref="contentScrollRef"
          :class="[
            'min-h-0 flex-1 overflow-y-auto px-4 lg:px-8',
            $slots.header || title || subtitle ? 'py-5 lg:py-6' : 'py-4 pr-14 lg:py-8',
            contentClass,
          ]"
        >
          <div class="px-1">
            <slot />
          </div>
        </div>

        <div
          v-if="$slots.footer"
          class="shrink-0 border-t border-gray-100 px-4 py-4 dark:border-gray-800 lg:px-8 lg:py-6"
        >
          <div class="flex flex-col-reverse gap-3 px-1 sm:flex-row sm:justify-end">
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
