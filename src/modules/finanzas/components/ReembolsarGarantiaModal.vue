<template>
  <AppModal v-model="open" title="Devolver garantía" size="md" :z-index="100000">
    <div v-if="garantia" class="space-y-4">
      <div class="grid grid-cols-2 gap-3 rounded-xl bg-gray-50 p-3 dark:bg-white/[0.03]">
        <div class="col-span-2">
          <p class="text-xs text-gray-400 dark:text-gray-500">Cliente</p>
          <p class="truncate text-sm font-medium text-gray-800 dark:text-white/90">
            {{ garantia.nombre_cliente || '—' }}
          </p>
        </div>
        <div>
          <p class="text-xs text-gray-400 dark:text-gray-500">Saldo pendiente</p>
          <p class="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
            {{ formatCurrency(garantia.monto_saldo) }}
          </p>
        </div>
        <div>
          <p class="text-xs text-gray-400 dark:text-gray-500">Método recibido</p>
          <p class="text-sm text-gray-700 dark:text-gray-300">{{ garantia.medio_pago || '—' }}</p>
        </div>
      </div>

      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <AppFormField label="Monto a devolver" required :error="errorMontoDisplay">
          <MoneyInput
            v-model="form.monto"
            placeholder="0.00"
            :state="errorMontoDisplay ? 'error' : 'default'"
            @blur="onBlurMonto"
          />
        </AppFormField>

        <AppFormField label="Fecha" required :error="errores.fecha">
          <AppInput
            v-model="form.fecha"
            type="date"
            :state="errores.fecha ? 'error' : 'default'"
          />
        </AppFormField>

      </div>

      <MedioPagoCuentaField
        v-model:id-medio-pago="form.idMedioReembolso"
        v-model:id-cuenta-bancaria="form.idCuentaBancariaReembolso"
        v-model:numero-operacion="form.numeroOperacion"
        v-model:valido="pagoValido"
        label-medio="Método de reembolso"
        :disabled="mutation.isPending.value"
        :mostrar-errores="intentoEnvio"
        excluir-credito
      />

      <AppFormField label="Observaciones" optional :error="errores.observacion">
        <AppTextarea
          v-model="form.observacion"
          :rows="3"
          placeholder="Ej.: entregado en tienda, voucher #123..."
        />
      </AppFormField>
    </div>

    <template #footer>
      <button
        type="button"
        class="flex w-full justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-white/[0.03] sm:w-auto"
        :disabled="mutation.isPending.value"
        @click="open = false"
      >
        Cancelar
      </button>
      <button
        type="button"
        class="flex w-full justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
        :disabled="mutation.isPending.value || !montoValido"
        @click="submit"
      >
        {{ mutation.isPending.value ? 'Guardando...' : 'Registrar devolución' }}
      </button>
    </template>
  </AppModal>
</template>

<script setup lang="ts">
import { computed, reactive, ref, toRef, watch } from 'vue'
import { AppInput, AppModal, AppTextarea, MoneyInput } from '@/shared/components'
import AppFormField from '@/shared/components/form/AppFormField.vue'
import { useMoneyField } from '@/shared/composables/useMoneyField'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import MedioPagoCuentaField from '@/modules/finanzas/components/MedioPagoCuentaField.vue'
import { useReembolsarGarantiaMutation } from '@/modules/finanzas/composables/useGarantiaMutations'
import type { Garantia } from '@/modules/finanzas/interfaces/garantia.interface'
import {
  formatCurrency,
  mensajeErrorMontoMoneda,
  parseMoneyInput,
  roundMoney,
} from '@/shared/utils/currency'

const props = defineProps<{ garantia: Garantia | null }>()
const emit = defineEmits<{ saved: [] }>()
const open = defineModel<boolean>({ required: true })

const authStore = useAuthStore()
const mutation = useReembolsarGarantiaMutation()

const pagoValido = ref(true)
const intentoEnvio = ref(false)

const form = reactive({
  monto: '',
  fecha: new Date().toISOString().slice(0, 10),
  idMedioReembolso: null as number | null,
  idCuentaBancariaReembolso: null as number | null,
  numeroOperacion: '',
  observacion: '',
})
const errores = reactive<Record<string, string | undefined>>({})

const moneyOpts = { min: 0.01 } as const
const { error: errorMonto, valido: montoValido, onBlur: onBlurMonto } = useMoneyField(
  toRef(form, 'monto'),
  moneyOpts,
)
const errorMontoDisplay = computed(() => errores.monto || errorMonto.value)

watch(
  () => [open.value, props.garantia] as const,
  ([isOpen, g]) => {
    if (!isOpen || !g) return
    Object.keys(errores).forEach((k) => (errores[k] = undefined))
    form.monto = Number(g.monto_saldo).toFixed(2)
    form.fecha = new Date().toISOString().slice(0, 10)
    form.idMedioReembolso = null
    form.idCuentaBancariaReembolso = null
    form.numeroOperacion = ''
    form.observacion = ''
    intentoEnvio.value = false
  },
)

const validar = (): boolean => {
  Object.keys(errores).forEach((k) => (errores[k] = undefined))
  let ok = true
  if (!form.fecha) { errores.fecha = 'La fecha es obligatoria'; ok = false }
  const msgMonto = mensajeErrorMontoMoneda(form.monto, moneyOpts)
  if (msgMonto) {
    errores.monto = msgMonto
    ok = false
  } else {
    const monto = roundMoney(parseMoneyInput(form.monto))
    const saldo = roundMoney(props.garantia?.monto_saldo)
    if (monto > saldo) {
      errores.monto = `No puede superar el saldo (${formatCurrency(saldo)})`
      ok = false
    }
  }
  if (form.observacion.length > 500) { errores.observacion = 'Máximo 500 caracteres'; ok = false }
  return ok
}

const submit = async () => {
  intentoEnvio.value = true
  if (!props.garantia) return
  if (mensajeErrorMontoMoneda(form.monto, moneyOpts)) return
  if (!validar() || !pagoValido.value) return

  try {
    await mutation.mutateAsync({
      id: props.garantia.id,
      payload: {
        monto: roundMoney(parseMoneyInput(form.monto)),
        fecha: form.fecha,
        idMedioReembolso: form.idMedioReembolso ?? undefined,
        idCuentaBancariaReembolso: form.idCuentaBancariaReembolso ?? undefined,
        numeroOperacion: form.numeroOperacion.trim() || undefined,
        observacion: form.observacion.trim() || undefined,
        idUsuarioAuditoria: authStore.user?.id ?? undefined,
      },
    })
    open.value = false
    emit('saved')
  } catch {
    /* toast en mutación */
  }
}
</script>
