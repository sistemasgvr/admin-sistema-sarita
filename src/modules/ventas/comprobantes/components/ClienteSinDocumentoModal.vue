<template>
  <AppModal
    v-model="open"
    title="Cliente sin documento"
    subtitle="El cliente no tiene RUC o DNI asignado"
    size="sm"
  >
    <div class="space-y-3">
      <div class="flex items-start gap-3">
        <div
          class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-warning-50 text-warning-500 dark:bg-warning-500/15"
        >
          <AppIcon :name="ICONS.alertTriangle" :size="20" />
        </div>
        <p class="pt-0.5 text-sm text-gray-600 dark:text-gray-400">
          <template v-if="nombreCliente">
            El cliente
            <span class="font-medium text-gray-800 dark:text-white/90">{{ nombreCliente }}</span>
            no tiene número de documento (RUC o DNI) asignado.
          </template>
          <template v-else>
            El cliente seleccionado no tiene número de documento (RUC o DNI) asignado.
          </template>
        </p>
      </div>

      <div
        v-if="allowClientesVarios"
        class="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm dark:border-gray-800 dark:bg-white/5"
      >
        <p class="text-gray-500 dark:text-gray-400">
          Este comprobante se {{ accion }} a SUNAT usando:
        </p>
        <div class="mt-1.5 flex items-center justify-between gap-2">
          <span class="font-medium text-gray-800 dark:text-white/90">Clientes Varios</span>
          <span
            class="rounded-md bg-gray-200 px-2 py-0.5 font-mono text-xs text-gray-700 dark:bg-white/10 dark:text-gray-300"
          >
            {{ CLIENTES_VARIOS_DOCUMENTO }}
          </span>
        </div>
      </div>

      <div
        v-else
        class="rounded-lg border border-warning-200 bg-warning-50 px-3 py-2.5 text-sm text-warning-800 dark:border-warning-500/30 dark:bg-warning-500/10 dark:text-warning-200"
      >
        La factura exige un cliente con RUC (11 dígitos). No se puede usar Clientes Varios.
        Edita el cliente o elige otro con RUC.
      </div>

      <p v-if="allowClientesVarios" class="text-sm text-gray-600 dark:text-gray-400">
        Puedes editar el cliente para asignarle un documento y luego continuar.
      </p>
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
        v-if="allowClientesVarios"
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
import { CLIENTES_VARIOS_DOCUMENTO } from '@/modules/clientes/constants/clientesVarios'
import { AppModal } from '@/shared/components'
import AppIcon from '@/shared/components/AppIcon.vue'
import { ICONS } from '@/shared/constants/icons'

const props = withDefaults(
  defineProps<{
    modelValue: boolean
    nombreCliente?: string
    accion?: string
    continueLabel?: string
    disabled?: boolean
    /** Boleta/otros: permite remapear a CVARIOS. Factura: false (exige RUC). */
    allowClientesVarios?: boolean
  }>(),
  {
    accion: 'emitirá',
    continueLabel: 'Continuar y emitir',
    disabled: false,
    allowClientesVarios: true,
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'edit-client': []
  continue: []
}>()

const open = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value),
})
</script>
