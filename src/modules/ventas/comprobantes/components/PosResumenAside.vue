<template>
  <DetailSectionCard title="Resumen" :icon="ICONS.creditCard">
    <div class="space-y-2 text-sm">
      <div class="flex justify-between">
        <span class="text-gray-500 dark:text-gray-400">Valor venta</span>
        <span class="tabular-nums text-gray-800 dark:text-white/90">{{
          formatMoney(totales.valorVenta)
        }}</span>
      </div>
      <div class="flex justify-between">
        <span class="text-gray-500 dark:text-gray-400">IGV (18% incluido)</span>
        <span class="tabular-nums text-gray-800 dark:text-white/90">{{
          formatMoney(totales.igv)
        }}</span>
      </div>
      <div
        class="flex justify-between border-t border-gray-200 pt-2 text-base font-semibold dark:border-gray-800"
      >
        <span class="text-gray-800 dark:text-white/90">Total</span>
        <span class="tabular-nums text-gray-800 dark:text-white/90">{{
          formatMoney(totales.total)
        }}</span>
      </div>
    </div>

    <div class="mt-5">
      <AppInput v-model="glosaModel" label="Glosa" placeholder="Opcional" />
    </div>

    <div
      v-if="comprobanteGuardadoSerie && comprobanteGuardadoNumero"
      class="mt-4 inline-flex w-full items-center gap-2 rounded-lg bg-success-500/10 p-3 text-sm text-success-700 dark:text-success-400"
    >
      <AppIcon :name="ICONS.clipboardCheck" :size="16" class="shrink-0" />
      <span>
        Comprobante {{ comprobanteGuardadoSerie }}-{{ comprobanteGuardadoNumero }} registrado.
      </span>
    </div>

    <div class="mt-5 flex flex-col gap-2">
      <button
        type="button"
        class="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-70"
        :disabled="!puedeGuardar || guardando"
        @click="emit('guardar')"
      >
        <AppIcon
          :name="guardando ? ICONS.loader : ICONS.clipboardCheck"
          :size="16"
          :class="guardando ? 'animate-spin' : ''"
        />
        {{ guardando ? guardandoLabel : guardarLabel }}
      </button>

      <button
        v-if="comprobanteGuardadoId && (esNotaVenta ? canPrint : canEmit)"
        type="button"
        class="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-success-500 px-4 py-2.5 text-sm font-medium text-success-600 hover:bg-success-500/10 disabled:cursor-not-allowed disabled:opacity-70"
        :disabled="emitiendo"
        @click="emit('emitir')"
      >
        <AppIcon
          :name="emitiendo ? ICONS.loader : ICONS.receipt"
          :size="16"
          :class="emitiendo ? 'animate-spin' : ''"
        />
        {{
          emitiendo
            ? esNotaVenta
              ? 'Imprimiendo...'
              : 'Emitiendo...'
            : esNotaVenta
              ? 'Imprimir ticket'
              : 'Emitir SUNAT'
        }}
      </button>

      <RouterLink
        :to="{
          name: esNotaVenta ? 'admin-ventas-vsd' : 'admin-ventas-comprobantes',
        }"
        class="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
      >
        <AppIcon :name="ICONS.list" :size="16" />
        {{ esNotaVenta ? 'Ver ventas sin documento' : 'Ver comprobantes' }}
      </RouterLink>
    </div>
  </DetailSectionCard>
</template>

<script setup lang="ts">
import { formatPosMoney } from '@/modules/ventas/comprobantes/composables/usePosComprobanteForm'
import { AppInput } from '@/shared/components'
import AppIcon from '@/shared/components/AppIcon.vue'
import DetailSectionCard from '@/shared/components/detail/DetailSectionCard.vue'
import { ICONS } from '@/shared/constants/icons'

withDefaults(
  defineProps<{
    totales: { valorVenta: number; igv: number; total: number }
    puedeGuardar: boolean
    guardando?: boolean
    emitiendo?: boolean
    canEmit?: boolean
    canPrint?: boolean
    esNotaVenta?: boolean
    comprobanteGuardadoId?: number | null
    comprobanteGuardadoSerie?: string | null
    comprobanteGuardadoNumero?: string | null
    guardarLabel?: string
    guardandoLabel?: string
  }>(),
  {
    guardarLabel: 'Guardar',
    guardandoLabel: 'Guardando...',
    canPrint: false,
    esNotaVenta: false,
  },
)

const emit = defineEmits<{
  guardar: []
  emitir: []
}>()

const glosaModel = defineModel<string>('glosa', { default: '' })

const formatMoney = formatPosMoney
</script>
