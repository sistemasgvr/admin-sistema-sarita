<template>
  <AppModal
    v-model="open"
    :title="title"
    :subtitle="subtitle"
    size="sm"
    :z-index="100001"
    :close-on-backdrop="!loading"
  >
    <div class="flex items-start gap-3">
      <span
        class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
        :class="iconWrapperClass"
      >
        <AppIcon :name="iconName" :size="20" />
      </span>
      <div class="min-w-0 flex-1">
        <p class="text-sm text-gray-700 dark:text-gray-300">
          <slot>{{ message }}</slot>
        </p>
      </div>
    </div>

    <template #footer>
      <button
        type="button"
        class="flex w-full justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-white/[0.03] sm:w-auto"
        :disabled="loading"
        @click="cancel"
      >
        {{ cancelLabel }}
      </button>
      <button
        type="button"
        class="flex w-full justify-center rounded-lg px-4 py-2.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
        :class="confirmButtonClass"
        :disabled="loading"
        @click="confirm"
      >
        {{ loading ? loadingLabel : confirmLabel }}
      </button>
    </template>
  </AppModal>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import AppModal from '@/shared/components/ui/AppModal.vue'
import AppIcon from '@/shared/components/AppIcon.vue'
import { ICONS } from '@/shared/constants/icons'

type ConfirmVariant = 'danger' | 'warning' | 'info'

const props = withDefaults(
  defineProps<{
    title: string
    subtitle?: string
    message?: string
    confirmLabel?: string
    cancelLabel?: string
    loadingLabel?: string
    variant?: ConfirmVariant
    loading?: boolean
  }>(),
  {
    confirmLabel: 'Confirmar',
    cancelLabel: 'Cancelar',
    loadingLabel: 'Procesando...',
    variant: 'danger',
    loading: false,
  },
)

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()

const open = defineModel<boolean>({ required: true })

const iconName = computed(() => {
  switch (props.variant) {
    case 'danger':
      return ICONS.alertTriangle
    case 'warning':
      return ICONS.alertCircle
    default:
      return ICONS.circleHelp
  }
})

const iconWrapperClass = computed(() => {
  switch (props.variant) {
    case 'danger':
      return 'bg-error-50 text-error-500 dark:bg-error-500/10 dark:text-error-400'
    case 'warning':
      return 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400'
    default:
      return 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400'
  }
})

const confirmButtonClass = computed(() => {
  switch (props.variant) {
    case 'danger':
      return 'bg-error-500 hover:bg-error-600'
    case 'warning':
      return 'bg-amber-500 hover:bg-amber-600'
    default:
      return 'bg-brand-500 hover:bg-brand-600'
  }
})

const confirm = () => emit('confirm')
const cancel = () => {
  open.value = false
  emit('cancel')
}
</script>
