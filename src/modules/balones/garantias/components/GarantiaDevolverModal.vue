<template>
  <AppModal
    v-model="open"
    title="Devolver garantía"
    subtitle="Registra la devolución parcial o total del depósito (MVP: sin NC automática)."
    size="md"
  >
    <div class="space-y-4">
      <AppSelect
        v-model="garantiaId"
        label="Garantía"
        placeholder="Selecciona garantía con saldo"
        required
        :options="garantiaOptions"
        :disabled="garantiasQuery.isFetching.value || Boolean(props.idGarantia)"
      />

      <div
        v-if="garantiaSeleccionada"
        class="rounded-xl border border-gray-100 p-3 text-sm dark:border-gray-800"
      >
        <p class="text-gray-500 dark:text-gray-400">Saldo pendiente</p>
        <p class="font-medium text-gray-800 dark:text-white/90">
          S/ {{ Number(garantiaSeleccionada.monto_saldo).toFixed(2) }}
          <span class="ml-2 text-xs font-normal text-gray-500">
            (cobrado {{ Number(garantiaSeleccionada.monto_cobrado).toFixed(2) }} ·
            devuelto {{ Number(garantiaSeleccionada.monto_devuelto).toFixed(2) }})
          </span>
        </p>
        <p
          v-if="garantiaSeleccionada.nombre_producto || garantiaSeleccionada.numero_prestamo"
          class="mt-1 text-xs text-gray-500 dark:text-gray-400"
        >
          {{
            [
              garantiaSeleccionada.nombre_producto,
              garantiaSeleccionada.numero_prestamo
                ? `Préstamo ${garantiaSeleccionada.numero_prestamo}`
                : null,
            ]
              .filter(Boolean)
              .join(' · ')
          }}
        </p>
      </div>

      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <AppFormField label="Monto a devolver" required :error="errorMontoDisplay">
          <MoneyInput
            v-model="monto"
            placeholder="0.00"
            :state="errorMontoDisplay ? 'error' : 'default'"
            @blur="onBlurMonto"
          />
        </AppFormField>
        <AppInput v-model="fecha" label="Fecha" type="date" required />
        <AppInput
          v-model="idComprobante"
          label="ID comprobante NC (opcional)"
          type="number"
          min="1"
          step="1"
          hint="Si ya emitiste la NC, indica su id para vincularla."
          class="sm:col-span-2"
        />
        <AppInput
          v-model="observacion"
          label="Observación"
          placeholder="Opcional"
          class="sm:col-span-2"
        />
      </div>
    </div>

    <template #footer>
      <button
        type="button"
        class="flex w-full justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 sm:w-auto"
        :disabled="devolverMutation.isPending.value"
        @click="open = false"
      >
        Cancelar
      </button>
      <button
        type="button"
        class="flex w-full justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
        :disabled="devolverMutation.isPending.value || !puedeDevolver"
        @click="confirmar"
      >
        {{ devolverMutation.isPending.value ? 'Registrando...' : 'Devolver garantía' }}
      </button>
    </template>
  </AppModal>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useDevolverGarantiaMutation } from '@/modules/balones/garantias/composables/useGarantiaMutations'
import { useGarantiasQuery } from '@/modules/balones/garantias/composables/useGarantiasQuery'
import type { GarantiaListFilters } from '@/modules/balones/garantias/interfaces/garantia.interface'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { AppInput, AppModal, AppSelect, MoneyInput } from '@/shared/components'
import AppFormField from '@/shared/components/form/AppFormField.vue'
import { useMoneyField } from '@/shared/composables/useMoneyField'
import { toastWarning } from '@/shared/composables/useToast'
import {
  mensajeErrorMontoMoneda,
  parseMoneyInput,
  roundMoney,
} from '@/shared/utils/currency'

const props = defineProps<{
  idCliente?: number | null
  idPrestamo?: number | null
  idGarantia?: number | null
}>()

const open = defineModel<boolean>({ default: false })
const emit = defineEmits<{ saved: [] }>()

const authStore = useAuthStore()
const devolverMutation = useDevolverGarantiaMutation()

const garantiaId = ref<number | ''>('')
const monto = ref('')
const fecha = ref(new Date().toISOString().slice(0, 10))
const idComprobante = ref<number | ''>('')
const observacion = ref('')
const errorSaldo = ref('')

const moneyOpts = { min: 0.01 } as const
const { error: errorMonto, valido: montoValidoRaw, onBlur: onBlurMonto } = useMoneyField(
  monto,
  moneyOpts,
)
const errorMontoDisplay = computed(() => errorSaldo.value || errorMonto.value)
const montoValido = computed(() => {
  if (!montoValidoRaw.value) return false
  const g = garantiaSeleccionada.value
  if (!g) return true
  const montoNum = roundMoney(parseMoneyInput(monto.value))
  return montoNum <= roundMoney(g.monto_saldo)
})

const filters = ref<GarantiaListFilters>({
  pagina: 1,
  limite: 50,
  idCliente: undefined,
  idPrestamo: undefined,
})
const garantiasQuery = useGarantiasQuery(filters)

const garantiasConSaldo = computed(() =>
  (garantiasQuery.data.value?.data ?? []).filter((g) => Number(g.monto_saldo) > 0),
)

const garantiaOptions = computed(() =>
  garantiasConSaldo.value.map((g) => ({
    value: g.id,
    label: `#${g.id} — ${g.nombre_cliente || 'Cliente'} · saldo S/ ${Number(g.monto_saldo).toFixed(2)} (${g.nombre_estado || 'ACTIVA'})`,
  })),
)

const garantiaSeleccionada = computed(() =>
  garantiasConSaldo.value.find((g) => g.id === garantiaId.value) ??
  (garantiasQuery.data.value?.data ?? []).find((g) => g.id === garantiaId.value),
)

const puedeDevolver = computed(
  () =>
    Boolean(garantiaId.value) &&
    montoValido.value &&
    Boolean(fecha.value),
)

watch(
  () => [open.value, props.idCliente, props.idPrestamo, props.idGarantia] as const,
  ([isOpen]) => {
    if (!isOpen) return
    filters.value = {
      pagina: 1,
      limite: 50,
      idCliente: props.idCliente ?? undefined,
      idPrestamo: props.idPrestamo ?? undefined,
    }
    garantiaId.value = props.idGarantia ?? ''
    fecha.value = new Date().toISOString().slice(0, 10)
    idComprobante.value = ''
    observacion.value = ''
    monto.value = ''
    errorSaldo.value = ''
  },
)

watch(
  () => [garantiasConSaldo.value, garantiaId.value, open.value] as const,
  ([rows, selected, isOpen]) => {
    if (!isOpen) return
    if (!selected && rows.length === 1) {
      garantiaId.value = rows[0].id
    }
    const g = rows.find((row) => row.id === (selected || garantiaId.value))
    if (g && !monto.value.trim()) {
      monto.value = Number(g.monto_saldo).toFixed(2)
    }
  },
)

watch(garantiaId, (value) => {
  errorSaldo.value = ''
  const g = garantiasConSaldo.value.find((row) => row.id === value)
  if (g) {
    monto.value = Number(g.monto_saldo).toFixed(2)
  }
})

watch(monto, () => {
  errorSaldo.value = ''
  const g = garantiaSeleccionada.value
  if (!g || !monto.value.trim()) return
  const msg = mensajeErrorMontoMoneda(monto.value, moneyOpts)
  if (msg) return
  const montoNum = roundMoney(parseMoneyInput(monto.value))
  const saldo = roundMoney(g.monto_saldo)
  if (montoNum > saldo) {
    errorSaldo.value = `No puede superar el saldo (S/ ${saldo.toFixed(2)})`
  }
})

async function confirmar() {
  const userId = authStore.user?.id
  if (!userId || !puedeDevolver.value || !garantiaId.value) {
    toastWarning('Indica garantía, monto válido y fecha')
    return
  }
  if (errorSaldo.value) return

  const montoNum = roundMoney(parseMoneyInput(monto.value))

  try {
    await devolverMutation.mutateAsync({
      id: Number(garantiaId.value),
      payload: {
        idUsuarioAuditoria: userId,
        monto: montoNum,
        idComprobante: idComprobante.value ? Number(idComprobante.value) : undefined,
        fecha: fecha.value,
        observacion: observacion.value.trim() || undefined,
      },
    })
    open.value = false
    emit('saved')
  } catch {
    // toast en mutation
  }
}
</script>
