<template>
  <div
    class="rounded-xl border border-brand-200 bg-brand-50/60 p-3 dark:border-brand-500/30 dark:bg-brand-500/5"
  >
    <div class="flex items-start justify-between gap-2">
      <div>
        <p class="text-sm font-medium text-gray-800 dark:text-white/90">
          {{
            modo === 'cuotas'
              ? `Plan de ${cuotasModel.length} cuotas`
              : `Crédito a ${diasCredito} días`
          }}
        </p>
        <p class="mt-0.5 text-xs text-gray-600 dark:text-gray-400">
          <template v-if="modo === 'cuotas'">
            Se registrará la cuenta por pagar. Puedes cambiar fechas y montos antes de guardar.
          </template>
          <template v-else>
            Vence el
            <strong>{{ formatListDate(fechaVencimientoModel) || '—' }}</strong>
            ·
            <strong>{{ formatMoney(total) }}</strong>. Puedes cambiar la fecha de vencimiento.
          </template>
        </p>
      </div>
      <AppHelpTip :text="helpText" />
    </div>

    <div v-if="modo === 'credito'" class="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
      <AppInput
        v-model="fechaVencimientoModel"
        type="date"
        label="Fecha de vencimiento"
        :disabled="disabled"
      />
      <div>
        <p class="text-xs text-gray-500 dark:text-gray-400">Monto CxP</p>
        <p class="mt-1 font-semibold tabular-nums text-gray-800 dark:text-white/90">
          {{ formatMoney(total) }}
        </p>
        <p v-if="total <= 0" class="mt-1 text-xs text-gray-400">
          Agrega productos al detalle para ver el monto.
        </p>
      </div>
    </div>

    <template v-else>
      <div class="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <AppInput
          :model-value="cuotasModel[0]?.fechaPago ?? ''"
          type="date"
          label="Primera cuota"
          help="Al cambiarla se recalculan las siguientes (mensual)."
          :disabled="disabled"
          @update:model-value="onPrimeraChange"
        />
        <AppInput
          :model-value="diaMesModel"
          type="number"
          label="Día del mes"
          :min="1"
          :max="31"
          :step="1"
          help="Día de vencimiento de las cuotas 2…N."
          :disabled="disabled"
          @update:model-value="onDiaMesChange"
        />
      </div>
      <p v-if="total <= 0" class="mt-2 text-xs text-gray-400">
        Agrega productos al detalle para ver los montos.
      </p>

      <div class="mt-3 overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
        <table class="min-w-full text-xs">
          <thead class="bg-white/70 dark:bg-white/5">
            <tr>
              <th class="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-300">Cuota</th>
              <th class="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-300">Vence</th>
              <th class="px-3 py-2 text-right font-medium text-gray-600 dark:text-gray-300">Monto</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(cuota, index) in cuotasModel"
              :key="cuota.numero"
              class="border-t border-gray-100 dark:border-gray-800"
            >
              <td class="px-3 py-1.5 text-gray-700 dark:text-gray-300">
                {{ cuota.numero }} / {{ cuotasModel.length }}
              </td>
              <td class="px-3 py-1.5">
                <input
                  :value="cuota.fechaPago"
                  type="date"
                  class="w-full min-w-[9.5rem] rounded-lg border border-gray-300 bg-transparent px-2 py-1 tabular-nums focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700"
                  :disabled="disabled"
                  :aria-label="`Vencimiento cuota ${cuota.numero}`"
                  @input="onFechaRow(index, ($event.target as HTMLInputElement).value)"
                />
              </td>
              <td class="px-3 py-1.5">
                <div class="min-w-[6rem]">
                  <MoneyInput
                    v-model="montoTexts[index]"
                    placeholder="0.00"
                    :disabled="disabled"
                    :state="montoErrors[index] ? 'error' : 'default'"
                    @focus="editingIndex = index"
                    @blur="onMontoBlur(index)"
                  />
                </div>
                <p
                  v-if="montoErrors[index]"
                  class="mt-0.5 text-right text-[10px] text-error-500"
                >
                  {{ montoErrors[index] }}
                </p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p
        v-if="sumaDistinta"
        class="mt-2 text-xs text-warning-600 dark:text-warning-400"
      >
        La suma de cuotas ({{ formatMoney(sumaCuotas) }}) no coincide con el total
        ({{ formatMoney(total) }}).
      </p>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import {
  aplicarPrimeraCuota,
  type CuotaPreviewItem,
} from '@/modules/compras/utils/previewCuotasCompra'
import { AppHelpTip, AppInput, MoneyInput } from '@/shared/components'
import {
  mensajeErrorMontoMoneda,
  parseMoneyInput,
  roundMoney,
} from '@/shared/utils/currency'
import { formatListDate } from '@/shared/utils/date'

const props = withDefaults(
  defineProps<{
    modo: 'cuotas' | 'credito'
    total: number
    diasCredito?: number
    disabled?: boolean
  }>(),
  {
    diasCredito: 0,
    disabled: false,
  },
)

const cuotasModel = defineModel<CuotaPreviewItem[]>('cuotas', { default: () => [] })
const fechaVencimientoModel = defineModel<string>('fechaVencimiento', { default: '' })
const diaMesPagoModel = defineModel<number>('diaMesPago', { default: 0 })

const diaMesModel = computed(() =>
  diaMesPagoModel.value > 0 ? String(diaMesPagoModel.value) : '',
)

const montoTexts = ref<string[]>([])
const montoErrors = ref<Record<number, string>>({})
const editingIndex = ref<number | null>(null)

const moneyOpts = { min: 0.01 } as const

watch(
  () => cuotasModel.value,
  (cuotas) => {
    if (montoTexts.value.length !== cuotas.length) {
      montoTexts.value = cuotas.map((c) => roundMoney(c.monto).toFixed(2))
      montoErrors.value = {}
      return
    }
    cuotas.forEach((c, i) => {
      if (editingIndex.value === i) return
      const parsed = parseMoneyInput(montoTexts.value[i])
      if (parsed == null || Math.abs(roundMoney(parsed) - roundMoney(c.monto)) > 0.001) {
        montoTexts.value[i] = roundMoney(c.monto).toFixed(2)
      }
    })
  },
  { deep: true, immediate: true },
)

watch(montoTexts, (texts) => {
  texts.forEach((text, index) => {
    if (editingIndex.value !== index) return
    const msg = mensajeErrorMontoMoneda(text, moneyOpts)
    montoErrors.value[index] = msg ?? ''
    if (!msg) {
      const n = parseMoneyInput(text)
      if (n != null) {
        cuotasModel.value = cuotasModel.value.map((item, i) =>
          i === index ? { ...item, monto: roundMoney(n) } : item,
        )
      }
    }
  })
}, { deep: true })

const sumaCuotas = computed(() =>
  cuotasModel.value.reduce((acc, item) => acc + roundMoney(item.monto), 0),
)
const sumaDistinta = computed(
  () =>
    props.modo === 'cuotas' &&
    props.total > 0 &&
    Math.abs(sumaCuotas.value - props.total) > 0.05,
)

const helpText = computed(() =>
  props.modo === 'cuotas'
    ? 'Igual que en Finanzas → Cuentas por pagar. Edita la primera fecha o cada vencimiento. Al guardar se crea el plan; los pagos se registran después.'
    : 'Crédito simple: una sola fecha de vencimiento. Al guardar se crea la cuenta por pagar; el pago se registra en Finanzas.',
)

function onPrimeraChange(value: string | number | null) {
  const primera = String(value || '')
  if (!primera) return
  const dia = diaMesPagoModel.value || Number(primera.slice(8, 10)) || 1
  if (!diaMesPagoModel.value) diaMesPagoModel.value = dia
  cuotasModel.value = aplicarPrimeraCuota(cuotasModel.value, primera, dia)
}

function onDiaMesChange(value: string | number | null) {
  const dia = Number(value)
  diaMesPagoModel.value = Number.isFinite(dia) ? dia : 0
  const primera = cuotasModel.value[0]?.fechaPago
  if (!primera || diaMesPagoModel.value < 1) return
  cuotasModel.value = aplicarPrimeraCuota(cuotasModel.value, primera, diaMesPagoModel.value)
}

function onFechaRow(index: number, fecha: string) {
  cuotasModel.value = cuotasModel.value.map((item, i) =>
    i === index ? { ...item, fechaPago: fecha } : item,
  )
}

function commitMontoRow(index: number, raw: string) {
  const msg = mensajeErrorMontoMoneda(raw, moneyOpts)
  if (msg) {
    montoErrors.value[index] = msg
    return false
  }
  const n = parseMoneyInput(raw)
  if (n == null) {
    montoErrors.value[index] = 'Monto inválido'
    return false
  }
  const monto = roundMoney(n)
  montoTexts.value[index] = monto.toFixed(2)
  montoErrors.value[index] = ''
  cuotasModel.value = cuotasModel.value.map((item, i) =>
    i === index ? { ...item, monto } : item,
  )
  return true
}

function onMontoBlur(index: number) {
  editingIndex.value = null
  commitMontoRow(index, montoTexts.value[index] ?? '')
}

function formatMoney(value: number) {
  return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(value)
}
</script>
