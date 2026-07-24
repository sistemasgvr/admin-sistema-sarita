<template>
  <AppModal v-model="open" title="Cliente sin documento" subtitle="El cliente no tiene RUC o DNI asignado" size="sm">
    <div class="flex gap-3">
      <div
        class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-warning-50 text-warning-500 dark:bg-warning-500/15"
      >
        <AppIcon :name="ICONS.alertTriangle" :size="20" />
      </div>

      <div class="space-y-3 pt-0.5">
        <p class="text-sm text-gray-600 dark:text-gray-400">
          <template v-if="nombreCliente">
            El cliente
            <span class="font-medium text-gray-800 dark:text-white/90">{{ nombreCliente }}</span>
            no tiene número de documento (RUC o DNI) asignado.
          </template>
          <template v-else>
            El cliente seleccionado no tiene número de documento (RUC o DNI) asignado.
          </template>
        </p>

        <div
          class="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm dark:border-gray-800 dark:bg-white/5"
        >
          <p class="text-gray-500 dark:text-gray-400">
            Este comprobante se {{ accion }} a SUNAT usando:
          </p>
          <div class="mt-1.5 flex items-center justify-between gap-2">
            <span class="font-medium text-gray-800 dark:text-white/90">Cliente Varios</span>
            <span
              class="rounded-md bg-gray-200 px-2 py-0.5 font-mono text-xs text-gray-700 dark:bg-white/10 dark:text-gray-300"
            >
              00000000
            </span>
          </div>
        </div>

        <p class="text-sm text-gray-600 dark:text-gray-400">
          Puedes editar el cliente para asignarle un documento y luego continuar.
        </p>
      </div>
    </div>

    <template #footer>
      <button
        type="button"
        class="inline-flex items-center justify-center gap-1.5 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-70 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-white/5"
        :disabled="disabled"
        @click="open = false"
      >
        Cancelar
      </button>
      <button
        type="button"
        class="inline-flex items-center justify-center gap-1.5 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-brand-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-70 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-white/5"
        :disabled="disabled"
        @click="emit('edit-client')"
      >
        <AppIcon :name="ICONS.users" :size="16" />
        Editar cliente
      </button>
      <button
        type="button"
        class="inline-flex items-center justify-center gap-1.5 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-70"
        :disabled="disabled"
        @click="emit('continue')"
      >
        {{ continueLabel }}
      </button>
    </template>
  </AppModal>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { AppModal } from '@/shared/components'
import AppIcon from '@/shared/components/AppIcon.vue'
import { ICONS } from '@/shared/constants/icons'

const props = withDefaults(defineProps<{
  modelValue: boolean
  nombreCliente?: string
  accion?: string
  continueLabel?: string
  disabled?: boolean
}>(), {
  accion: 'emitirá',
  continueLabel: 'Continuar y emitir',
  disabled: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'edit-client': []
  'continue': []
}>()

const open = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value),
})
</script>