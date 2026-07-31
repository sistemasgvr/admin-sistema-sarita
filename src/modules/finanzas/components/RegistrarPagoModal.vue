<template>
  <AppModal v-model="open" :title="titulo" :subtitle="subtitulo" size="md">
    <div v-if="cuenta" class="space-y-4">
      <!-- Resumen de la cuenta -->
      <div class="grid grid-cols-2 gap-3 rounded-xl bg-gray-50 p-4 dark:bg-white/[0.03]">
        <div>
          <p class="text-xs text-gray-400 dark:text-gray-500">{{ terceroLabel }}</p>
          <p class="truncate text-sm font-medium text-gray-800 dark:text-white/90">
            {{ cuenta.tercero }}
          </p>
        </div>
        <div>
          <p class="text-xs text-gray-400 dark:text-gray-500">Comprobante</p>
          <p class="text-sm text-gray-700 dark:text-gray-300">{{ cuenta.comprobante || '—' }}</p>
        </div>
        <div>
          <p class="text-xs text-gray-400 dark:text-gray-500">Saldo pendiente</p>
          <p class="text-sm font-semibold text-rose-600 dark:text-rose-400">
            {{ formatCurrency(cuenta.saldo) }}
          </p>
        </div>
        <div>
          <p class="text-xs text-gray-400 dark:text-gray-500">Vencimiento</p>
          <p class="text-sm text-gray-700 dark:text-gray-300">
            {{ formatListDate(cuenta.fecha_vencimiento) }}
          </p>
        </div>
      </div>

      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <AppFormField label="Monto" required :error="errores.monto">
          <AppInput
            v-model="form.monto"
            type="number"
            inputmode="decimal"
            placeholder="0.00"
            :state="errores.monto ? 'error' : 'default'"
          />
        </AppFormField>

        <AppFormField label="Fecha de pago" required>
          <AppInput v-model="form.fechaPago" type="date" />
        </AppFormField>

        <AppFormField label="Medio de pago">
          <AppSelect
            v-model="form.idMedioPago"
            :options="medioPagoOptions"
            placeholder="Selecciona un medio"
          />
        </AppFormField>

        <AppFormField label="Referencia / N° operación">
          <AppInput v-model="form.referencia" type="text" placeholder="Opcional" />
        </AppFormField>
      </div>

      <AppFormField label="Observación">
        <AppTextarea v-model="form.observacion" :rows="2" placeholder="Opcional" />
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
        :disabled="mutation.isPending.value"
        @click="submit"
      >
        {{ mutation.isPending.value ? 'Guardando...' : ctaLabel }}
      </button>
    </template>
  </AppModal>
</template>

<script setup lang="ts">
import { computed, reactive, watch } from 'vue'
import { AppInput, AppModal, AppSelect, AppTextarea } from '@/shared/components'
import AppFormField from '@/shared/components/form/AppFormField.vue'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { useMediosPagoQuery } from '@/modules/finanzas/composables/useMediosPagoQuery'
import { useRegistrarPagoMutation } from '@/modules/finanzas/composables/usePagoMutations'
import type {
  CuentaFinanciera,
  TipoCuenta,
} from '@/modules/finanzas/interfaces/cuenta.interface'
import { formatCurrency } from '@/shared/utils/currency'
import { formatListDate } from '@/shared/utils/date'
import type { SelectOption } from '@/shared/interfaces/form.interface'

const props = defineProps<{
  cuenta: CuentaFinanciera | null
  tipo: TipoCuenta
}>()

const emit = defineEmits<{ saved: [] }>()

const open = defineModel<boolean>({ required: true })

const authStore = useAuthStore()
const mediosPagoQuery = useMediosPagoQuery()
const mutation = useRegistrarPagoMutation(props.tipo)

const esCobrar = computed(() => props.tipo === 'COBRAR')
const titulo = computed(() => (esCobrar.value ? 'Registrar cobranza' : 'Registrar pago'))
const subtitulo = computed(() =>
  esCobrar.value ? 'Aplica un abono a la cuenta por cobrar.' : 'Aplica un abono a la cuenta por pagar.',
)
const ctaLabel = computed(() => (esCobrar.value ? 'Registrar cobranza' : 'Registrar pago'))
const terceroLabel = computed(() => (esCobrar.value ? 'Cliente' : 'Proveedor'))

const medioPagoOptions = computed<SelectOption[]>(() =>
  (mediosPagoQuery.data.value ?? []).map((medio) => ({ label: medio.nombre, value: medio.id })),
)

const hoy = () => new Date().toISOString().slice(0, 10)

const form = reactive({
  monto: '' as string | number,
  fechaPago: hoy(),
  idMedioPago: '' as string | number,
  referencia: '',
  observacion: '',
})

const errores = reactive<{ monto?: string }>({})

const resetForm = () => {
  form.monto = props.cuenta ? Number(props.cuenta.saldo) : ''
  form.fechaPago = hoy()
  form.idMedioPago = ''
  form.referencia = ''
  form.observacion = ''
  errores.monto = undefined
}

watch(open, (isOpen) => {
  if (isOpen) resetForm()
})

const validar = (): boolean => {
  errores.monto = undefined
  const monto = Number(form.monto)
  const saldo = Number(props.cuenta?.saldo ?? 0)

  if (!monto || monto <= 0) {
    errores.monto = 'Ingresa un monto mayor a cero'
    return false
  }
  if (monto > saldo + 0.0001) {
    errores.monto = `El monto no puede superar el saldo (${formatCurrency(saldo)})`
    return false
  }
  return true
}

const submit = async () => {
  if (!props.cuenta || !validar()) return

  try {
    await mutation.mutateAsync({
      idCuenta: props.cuenta.id,
      monto: Number(form.monto),
      fechaPago: form.fechaPago || undefined,
      idMedioPago: form.idMedioPago ? Number(form.idMedioPago) : undefined,
      referencia: form.referencia.trim() || undefined,
      observacion: form.observacion.trim() || undefined,
      idUsuarioAuditoria: authStore.user?.id ?? undefined,
    })
    open.value = false
    emit('saved')
  } catch {
    // El toast de error ya lo maneja la mutación.
  }
}
</script>
