<template>
  <div class="space-y-3">
    <div
      v-for="(linea, index) in lineas"
      :key="linea.key"
      class="space-y-2"
      :class="lineas.length > 1 ? 'rounded-lg border border-gray-200 p-3 dark:border-gray-800' : ''"
    >
      <div v-if="lineas.length > 1" class="flex items-center justify-between">
        <span class="text-theme-xs font-medium text-gray-500 dark:text-gray-400">
          Pago {{ index + 1 }}
        </span>
        <button
          type="button"
          class="inline-flex items-center gap-1 text-theme-xs text-error-600 hover:text-error-700 disabled:cursor-not-allowed disabled:opacity-50 dark:text-error-400"
          :disabled="disabled"
          @click="emit('quitar', linea.key)"
        >
          <AppIcon :name="ICONS.trash" :size="14" />
          Quitar
        </button>
      </div>
      <MedioPagoCuentaField
        v-model:id-medio-pago="linea.idMedioPago"
        v-model:id-cuenta-bancaria="linea.idCuentaBancaria"
        v-model:numero-operacion="linea.numeroOperacion"
        v-model:valido="linea.valido"
        :disabled="disabled"
        medio-requerido
        excluir-credito
        numero-operacion-opcional
      />
      <AppFormField label="Monto" required>
        <MoneyInput
          :model-value="textoMonto(linea)"
          :disabled="disabled"
          @update:model-value="(v: string) => onMontoInput(linea, v)"
          @blur="onMontoBlur(linea)"
        />
      </AppFormField>
    </div>

    <div class="flex items-center justify-between gap-2">
      <button
        type="button"
        class="inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700 disabled:cursor-not-allowed disabled:opacity-50 dark:text-brand-400"
        :disabled="disabled"
        @click="emit('agregar')"
      >
        + Agregar medio
      </button>
      <span
        v-if="Math.abs(saldo) > 0.01"
        class="text-theme-xs font-medium tabular-nums text-error-600 dark:text-error-400"
      >
        {{ saldo > 0 ? 'Pendiente' : 'Excedente' }}: {{ formatMoney(Math.abs(saldo)) }}
      </span>
    </div>

    <template v-if="hayEfectivo">
      <AppFormField label="Efectivo recibido" optional>
        <MoneyInput
          :model-value="textoEfectivo ?? (efectivoRecibido == null ? '' : efectivoRecibido.toFixed(2))"
          :disabled="disabled"
          @update:model-value="onEfectivoInput"
          @blur="textoEfectivo = null"
        />
      </AppFormField>
      <div
        v-if="montoVuelto != null"
        class="flex justify-between text-sm font-semibold"
      >
        <span class="text-gray-800 dark:text-white/90">Vuelto</span>
        <span class="tabular-nums text-brand-600 dark:text-brand-400">{{
          formatMoney(montoVuelto)
        }}</span>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import MedioPagoCuentaField from '@/modules/finanzas/components/MedioPagoCuentaField.vue'
import { useMediosPagoQuery } from '@/modules/finanzas/composables/useMediosPagoQuery'
import { formatPosMoney } from '@/modules/ventas/comprobantes/composables/usePosComprobanteForm'
import {
  efectivoACobrar,
  saldoPendiente,
  vuelto,
  type LineaPagoForm,
} from '@/modules/ventas/comprobantes/utils/pagosMixtos'
import { MoneyInput } from '@/shared/components'
import AppIcon from '@/shared/components/AppIcon.vue'
import AppFormField from '@/shared/components/form/AppFormField.vue'
import { ICONS } from '@/shared/constants/icons'
import { parseMoneyInput, roundMoney } from '@/shared/utils/currency'

const props = withDefaults(
  defineProps<{
    total: number
    disabled?: boolean
    /** Efectivo a cobrar fuera de las líneas (garantía en efectivo). */
    efectivoAdicional?: number
  }>(),
  {
    disabled: false,
    efectivoAdicional: 0,
  },
)

const emit = defineEmits<{ agregar: []; quitar: [key: string] }>()

const lineas = defineModel<LineaPagoForm[]>('lineas', { required: true })
const efectivoRecibido = defineModel<number | null>('efectivoRecibido', { default: null })

const formatMoney = formatPosMoney

const mediosQuery = useMediosPagoQuery()
const idsEfectivo = computed<ReadonlySet<number>>(
  () => new Set((mediosQuery.data.value ?? []).filter((m) => m.esEfectivo).map((m) => m.id)),
)

const saldo = computed(() => saldoPendiente(props.total, lineas.value))
const hayEfectivo = computed(
  () => efectivoACobrar(lineas.value, idsEfectivo.value, props.efectivoAdicional) > 0,
)
const montoVuelto = computed(() =>
  vuelto(efectivoRecibido.value, lineas.value, idsEfectivo.value, props.efectivoAdicional),
)

// Texto mientras se escribe: el monto numérico se formatea recién al salir del campo.
const textosMonto = reactive<Record<string, string>>({})
const textoEfectivo = ref<string | null>(null)

function textoMonto(linea: LineaPagoForm): string {
  return textosMonto[linea.key] ?? roundMoney(linea.monto).toFixed(2)
}

function onMontoInput(linea: LineaPagoForm, valor: string) {
  textosMonto[linea.key] = valor
  linea.monto = roundMoney(parseMoneyInput(valor) ?? 0)
}

function onMontoBlur(linea: LineaPagoForm) {
  delete textosMonto[linea.key]
}

function onEfectivoInput(valor: string) {
  textoEfectivo.value = valor
  const n = parseMoneyInput(valor)
  efectivoRecibido.value = n == null ? null : roundMoney(n)
}
</script>
