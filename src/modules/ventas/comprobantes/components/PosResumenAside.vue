<template>
  <div class="space-y-4 rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
    <h3 class="text-sm font-semibold text-gray-800 dark:text-white/90">Resumen</h3>

    <div class="space-y-2 text-sm">
      <div class="flex justify-between">
        <span class="text-gray-500">Valor venta</span>
        <span class="tabular-nums">{{ formatMoney(totales.valorVenta) }}</span>
      </div>
      <div class="flex justify-between">
        <span class="text-gray-500">IGV (18%)</span>
        <span class="tabular-nums">{{ formatMoney(totales.igv) }}</span>
      </div>
      <div
        class="flex justify-between border-t border-gray-200 pt-2 text-base font-semibold dark:border-gray-800"
      >
        <span>Total</span>
        <span class="tabular-nums">{{ formatMoney(totales.total) }}</span>
      </div>
    </div>

    <AppInput v-model="glosaModel" label="Glosa" placeholder="Opcional" />

    <div
      v-if="comprobanteGuardadoSerie && comprobanteGuardadoNumero"
      class="rounded-lg bg-success-500/10 p-3 text-sm text-success-700 dark:text-success-400"
    >
      Comprobante {{ comprobanteGuardadoSerie }}-{{ comprobanteGuardadoNumero }} registrado.
    </div>

    <div class="flex flex-col gap-2">
      <button
        type="button"
        class="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-70"
        :disabled="!puedeGuardar || guardando"
        @click="emit('guardar')"
      >
        {{ guardando ? guardandoLabel : guardarLabel }}
      </button>

      <button
        v-if="comprobanteGuardadoId && canEmit"
        type="button"
        class="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-success-500 px-4 py-2.5 text-sm font-medium text-success-600 hover:bg-success-500/10 disabled:cursor-not-allowed disabled:opacity-70"
        :disabled="emitiendo"
        @click="emit('emitir')"
      >
        {{ emitiendo ? 'Emitiendo...' : 'Emitir SUNAT' }}
      </button>

      <RouterLink
        :to="{ name: 'admin-ventas-comprobantes' }"
        class="inline-flex w-full items-center justify-center rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300"
      >
        Ver comprobantes
      </RouterLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import { formatPosMoney } from '@/modules/ventas/comprobantes/composables/usePosComprobanteForm'
import { AppInput } from '@/shared/components'

defineProps<{
  totales: { valorVenta: number; igv: number; total: number }
  puedeGuardar: boolean
  guardando?: boolean
  emitiendo?: boolean
  canEmit?: boolean
  comprobanteGuardadoId?: number | null
  comprobanteGuardadoSerie?: string | null
  comprobanteGuardadoNumero?: string | null
  guardarLabel?: string
  guardandoLabel?: string
}>()

const emit = defineEmits<{
  guardar: []
  emitir: []
}>()

const glosaModel = defineModel<string>('glosa', { default: '' })

const formatMoney = formatPosMoney
</script>
