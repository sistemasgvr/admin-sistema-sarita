<template>
  <div
    v-if="mensaje"
    class="flex flex-col gap-3 rounded-2xl border px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
    :class="bannerClass"
  >
    <div class="flex items-start gap-3">
      <span
        class="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
        :class="iconWrapClass"
      >
        <AppIcon :name="ICONS.alertTriangle" :size="18" />
      </span>
      <div>
        <p class="text-sm font-semibold" :class="titleClass">
          {{ titulo }}
        </p>
        <p class="mt-0.5 text-theme-sm" :class="bodyClass">
          {{ mensaje }}
        </p>
      </div>
    </div>
    <RouterLink
      :to="ctaTo"
      class="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg bg-brand-500 px-3 py-2 text-sm font-medium text-white hover:bg-brand-600"
    >
      <AppIcon :name="ICONS.cashRegister" :size="16" />
      {{ ctaLabel }}
    </RouterLink>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import AppIcon from '@/shared/components/AppIcon.vue'
import { ICONS } from '@/shared/constants/icons'

const props = defineProps<{
  mensaje: string | null
  cajaCerrada?: boolean
  pendienteCierre?: boolean
  fechaPendiente?: string | null
}>()

const titulo = computed(() => {
  if (props.pendienteCierre) return 'Caja sin cerrar (día anterior)'
  if (props.cajaCerrada) return 'Caja cerrada'
  return 'Caja no abierta'
})

const ctaLabel = computed(() =>
  props.pendienteCierre ? 'Cerrar caja pendiente' : 'Ir a Caja',
)

const ctaTo = computed(() => {
  if (props.pendienteCierre && props.fechaPendiente) {
    return {
      name: 'admin-ventas-caja',
      query: { fecha: String(props.fechaPendiente).slice(0, 10) },
    }
  }
  return { name: 'admin-ventas-caja' }
})

const esAlertaFuerte = computed(() => Boolean(props.pendienteCierre))

const bannerClass = computed(() =>
  props.cajaCerrada && !esAlertaFuerte.value
    ? 'border-warning-200 bg-warning-50 dark:border-warning-500/30 dark:bg-warning-500/10'
    : 'border-error-200 bg-error-50 dark:border-error-500/30 dark:bg-error-500/10',
)

const iconWrapClass = computed(() =>
  props.cajaCerrada && !esAlertaFuerte.value
    ? 'bg-warning-100 text-warning-700 dark:bg-warning-500/20 dark:text-warning-300'
    : 'bg-error-100 text-error-700 dark:bg-error-500/20 dark:text-error-300',
)

const titleClass = computed(() =>
  props.cajaCerrada && !esAlertaFuerte.value
    ? 'text-warning-800 dark:text-warning-300'
    : 'text-error-900 dark:text-error-200',
)

const bodyClass = computed(() =>
  props.cajaCerrada && !esAlertaFuerte.value
    ? 'text-warning-700 dark:text-warning-400'
    : 'text-error-800 dark:text-error-300',
)
</script>
