<template>
  <Teleport to="body">
    <div
      v-if="modelValue"
      class="fixed inset-0 z-99999 flex items-center justify-center overflow-y-auto p-4 sm:p-6"
    >
      <div
        class="fixed inset-0 h-full w-full bg-gray-400/50 backdrop-blur-[32px]"
        aria-hidden="true"
        @click="onBackdropClick"
      />

      <div
        role="dialog"
        aria-modal="true"
        :aria-labelledby="titleId"
        class="no-scrollbar relative w-full overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-8"
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

        <div v-if="$slots.header || title || subtitle" class="px-1 pr-12 lg:pr-14">
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

        <div
          :class="[
            $slots.header || title || subtitle ? 'mt-5 lg:mt-6' : 'pr-10',
            contentClass,
          ]"
        >
          <slot />
        </div>

        <div
          v-if="$slots.footer"
          class="mt-6 flex flex-col-reverse gap-3 px-1 sm:flex-row sm:justify-end"
        >
          <slot name="footer" />
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, onUnmounted, useId, watch } from 'vue'
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
})

onUnmounted(() => {
  document.body.style.overflow = ''
})
</script>
