<template>
  <div
    class="flex flex-col gap-4 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between"
    :class="contenedorClass"
  >
    <div class="flex min-w-0 items-start gap-3">
      <span
        class="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
        :class="iconoClass"
      >
        <AppIcon :name="estado === 'ok' ? icono : ICONS.alertTriangle" :size="18" />
      </span>
      <div class="min-w-0">
        <p class="text-sm font-semibold text-gray-800 dark:text-white/90">{{ modalidad }}</p>
        <p class="mt-0.5 text-xs" :class="detalleClass">{{ detalle }}</p>
      </div>
    </div>

    <div class="flex items-center justify-between gap-4 sm:justify-end">
      <div v-if="total" class="text-right">
        <p class="text-[11px] text-gray-500 dark:text-gray-400">Total a pagar</p>
        <p class="text-sm font-semibold tabular-nums text-gray-800 dark:text-white/90">{{ total }}</p>
      </div>
      <button
        type="button"
        class="inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium transition disabled:opacity-50"
        :class="
          estado === 'ok'
            ? 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-white/5'
            : 'bg-brand-500 text-white hover:bg-brand-600'
        "
        :disabled="disabled"
        @click="emit('editar')"
      >
        <AppIcon :name="estado === 'ok' ? ICONS.pencil : ICONS.wallet" :size="15" />
        {{ estado === 'ok' ? 'Cambiar' : 'Registrar pago' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import AppIcon from '@/shared/components/AppIcon.vue'
import { ICONS, type IconName } from '@/shared/constants/icons'

/**
 * Resumen de una línea del pago de la compra; el detalle se edita en el modal.
 * `pendiente`: falta un dato obligatorio; `error`: además ya se intentó guardar.
 */
const props = withDefaults(
  defineProps<{
    modalidad: string
    detalle: string
    estado: 'ok' | 'pendiente' | 'error'
    icono: IconName
    total?: string
    disabled?: boolean
  }>(),
  {
    total: '',
    disabled: false,
  },
)

const emit = defineEmits<{
  editar: []
}>()

const contenedorClass = computed(() => {
  if (props.estado === 'error') return 'border-error-300 bg-error-50/60 dark:border-error-500/40 dark:bg-error-500/5'
  if (props.estado === 'pendiente') return 'border-dashed border-gray-300 dark:border-gray-700'
  return 'border-gray-200 bg-gray-50/60 dark:border-gray-800 dark:bg-white/3'
})

const iconoClass = computed(() => {
  if (props.estado === 'error') return 'bg-error-100 text-error-600 dark:bg-error-500/15 dark:text-error-400'
  if (props.estado === 'pendiente') return 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400'
  return 'bg-brand-50 text-brand-500 dark:bg-brand-500/15 dark:text-brand-400'
})

const detalleClass = computed(() => {
  if (props.estado === 'error') return 'font-medium text-error-600 dark:text-error-400'
  if (props.estado === 'pendiente') return 'text-amber-700 dark:text-amber-400'
  return 'text-gray-500 dark:text-gray-400'
})
</script>
