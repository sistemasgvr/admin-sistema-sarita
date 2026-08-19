<template>
  <AppModal v-model="open" title="Registrar depósito a banco" size="md">
    <div class="space-y-4">
      <p class="text-theme-sm text-gray-500 dark:text-gray-400">
        Sale de la caja hacia el banco. Reduce el efectivo esperado del arqueo.
      </p>
      <AppFormField label="Monto" required :error="errorMonto">
        <MoneyInput
          v-model="form.monto"
          placeholder="0.00"
          :state="errorMonto ? 'error' : 'default'"
          @blur="onBlurMonto"
        />
      </AppFormField>
      <AppFormField label="Medio de pago" optional>
        <AppSelect v-model="form.idMedioPago" :options="medioOptions" placeholder="Depósito / transferencia..." />
      </AppFormField>
      <AppFormField label="Nº operación" optional>
        <AppInput v-model="form.numeroOperacion" />
      </AppFormField>
      <AppFormField label="Observación" optional>
        <AppTextarea v-model="form.observacion" :rows="2" />
      </AppFormField>
    </div>
    <template #footer>
      <button
        type="button"
        class="flex w-full justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 sm:w-auto"
        :disabled="guardando"
        @click="open = false"
      >
        Cancelar
      </button>
      <button
        type="button"
        class="flex w-full justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
        :disabled="guardando || !formularioValido"
        @click="submit"
      >
        {{ guardando ? 'Guardando...' : 'Registrar depósito' }}
      </button>
    </template>
  </AppModal>
</template>

<script setup lang="ts">
import { computed, reactive, toRef, watch } from 'vue'
import { AppInput, AppModal, AppSelect, AppTextarea, MoneyInput } from '@/shared/components'
import AppFormField from '@/shared/components/form/AppFormField.vue'
import { useCrearCajaDepositoMutation } from '@/modules/caja/composables/useCajaQuery'
import { useMediosPagoQuery } from '@/modules/finanzas/composables/useMediosPagoQuery'
import { useMoneyField } from '@/shared/composables/useMoneyField'
import { mensajeErrorMontoMoneda, parseMoneyInput, roundMoney } from '@/shared/utils/currency'
import type { SelectOption } from '@/shared/interfaces/form.interface'

const open = defineModel<boolean>({ default: false })
const props = defineProps<{ fecha: string; idSesion?: number | null; idSucursal?: number | null }>()
const emit = defineEmits<{ saved: [] }>()

const form = reactive({
  monto: '',
  idMedioPago: null as number | null,
  numeroOperacion: '',
  observacion: '',
})
const mutation = useCrearCajaDepositoMutation()
const mediosQuery = useMediosPagoQuery()
const guardando = computed(() => mutation.isPending.value)
const medioOptions = computed<SelectOption[]>(() =>
  (mediosQuery.data.value ?? []).map((m) => ({ value: m.id, label: m.nombre })),
)

const { error: errorMonto, valido: formularioValido, onBlur: onBlurMonto } = useMoneyField(
  toRef(form, 'monto'),
  { min: 0.01 },
)

watch(open, (v) => {
  if (v) {
    form.monto = ''
    form.idMedioPago = null
    form.numeroOperacion = ''
    form.observacion = ''
  }
})

async function submit() {
  if (mensajeErrorMontoMoneda(form.monto, { min: 0.01 })) return

  const monto = roundMoney(parseMoneyInput(form.monto))

  await mutation.mutateAsync({
    fecha: props.fecha,
    monto,
    idMedioPago: form.idMedioPago,
    numeroOperacion: form.numeroOperacion || undefined,
    observacion: form.observacion || undefined,
    idSesion: props.idSesion ?? undefined,
    idSucursal: props.idSucursal ?? undefined,
  })
  open.value = false
  emit('saved')
}
</script>
