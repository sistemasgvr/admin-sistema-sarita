<template>
  <AppModal v-model="open" :title="titulo" :subtitle="subtitulo" size="md" :z-index="100000">
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
        <AppFormField label="Monto" required :error="errorMontoDisplay">
          <MoneyInput
            v-model="form.monto"
            placeholder="0.00"
            :state="errorMontoDisplay ? 'error' : 'default'"
            @blur="onBlurMonto"
          />
        </AppFormField>

        <AppFormField label="Fecha de pago" required :error="errores.fechaPago">
          <AppInput
            v-model="form.fechaPago"
            type="date"
            :min="fechaEmisionMin"
            :state="errores.fechaPago ? 'error' : 'default'"
          />
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
        :disabled="mutation.isPending.value || !formularioValido"
        @click="submit"
      >
        {{ mutation.isPending.value ? 'Guardando...' : ctaLabel }}
      </button>
    </template>
  </AppModal>

  <AppConfirmDialog
    v-model="confirmDuplicadoOpen"
    :title="
      duplicadoInfo?.severidad === 'alta'
        ? tipo === 'PAGAR'
          ? 'Posible pago duplicado al proveedor'
          : 'Posible pago/cobranza duplicado (exacto)'
        : tipo === 'PAGAR'
          ? 'Posible pago duplicado al proveedor'
          : 'Posible pago/cobranza duplicado'
    "
    :variant="duplicadoInfo?.severidad === 'alta' ? 'danger' : 'warning'"
    :confirm-label="canForzarDuplicado ? 'Sí, registrar de todas formas' : 'No tienes permiso para forzar'"
    :loading="mutation.isPending.value"
    @confirm="canForzarDuplicado ? forzarPagoDuplicado() : null"
  >
    <span>
      {{ duplicadoInfo?.mensaje }}
      <template v-if="!canForzarDuplicado">
        <br /><br />
        <span class="text-theme-xs">
          Para registrar un pago que el sistema detecta como duplicado, necesitas el permiso
          <code>finanzas.forzar_duplicado</code>.
        </span>
      </template>
    </span>
  </AppConfirmDialog>
</template>

<script setup lang="ts">
import { computed, reactive, ref, toRef, watch } from 'vue'
import { AppConfirmDialog, AppInput, AppModal, AppSelect, AppTextarea, MoneyInput } from '@/shared/components'
import AppFormField from '@/shared/components/form/AppFormField.vue'
import { useMoneyField } from '@/shared/composables/useMoneyField'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { useMediosPagoQuery } from '@/modules/finanzas/composables/useMediosPagoQuery'
import { useRegistrarPagoMutation } from '@/modules/finanzas/composables/usePagoMutations'
import { finanzasService } from '@/modules/finanzas/services/finanzas.service'
import type {
  CuentaFinanciera,
  TipoCuenta,
} from '@/modules/finanzas/interfaces/cuenta.interface'
import type { DuplicadoPagoInfo } from '@/modules/finanzas/interfaces/garantia.interface'
import { PermisoBanderas } from '@/shared/constants/permissions'
import {
  formatCurrency,
  mensajeErrorMontoMoneda,
  parseMoneyInput,
  roundMoney,
} from '@/shared/utils/currency'
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

const fechaEmisionMin = computed(() => props.cuenta?.fecha_emision ?? undefined)

const form = reactive({
  monto: '',
  fechaPago: hoy(),
  idMedioPago: '' as string | number,
  referencia: '',
  observacion: '',
})

const errores = reactive<{ monto?: string; fechaPago?: string }>({})

const moneyOpts = { min: 0.01 } as const
const { error: errorMonto, valido: montoValido, onBlur: onBlurMonto } = useMoneyField(
  toRef(form, 'monto'),
  moneyOpts,
)
const errorMontoDisplay = computed(() => errores.monto || errorMonto.value)
const formularioValido = computed(
  () =>
    montoValido.value &&
    Boolean(form.fechaPago) &&
    (!props.cuenta?.fecha_emision || form.fechaPago >= props.cuenta.fecha_emision),
)

const resetForm = () => {
  form.monto = props.cuenta ? roundMoney(props.cuenta.saldo).toFixed(2) : ''
  // Si hoy es anterior a la emisión (caso raro), usa la fecha de emisión
  const h = hoy()
  form.fechaPago = props.cuenta?.fecha_emision && h < props.cuenta.fecha_emision
    ? props.cuenta.fecha_emision
    : h
  form.idMedioPago = ''
  form.referencia = ''
  form.observacion = ''
  errores.monto = undefined
  errores.fechaPago = undefined
}

watch(open, (isOpen) => {
  if (isOpen) resetForm()
})

watch(
  () => form.fechaPago,
  (v) => {
    const emision = props.cuenta?.fecha_emision
    if (v && (!emision || v >= emision)) errores.fechaPago = undefined
  },
)

const validar = (): boolean => {
  errores.monto = undefined
  errores.fechaPago = undefined
  let ok = true

  const msgMonto = mensajeErrorMontoMoneda(form.monto, moneyOpts)
  if (msgMonto) {
    errores.monto = msgMonto
    ok = false
  }

  const monto = parseMoneyInput(form.monto)
  const saldo = roundMoney(props.cuenta?.saldo)

  if (ok && monto != null && roundMoney(monto) > saldo) {
    errores.monto = `El monto no puede superar el saldo (${formatCurrency(saldo)})`
    ok = false
  }

  if (!form.fechaPago) {
    errores.fechaPago = 'La fecha de pago es obligatoria'
    ok = false
  } else if (props.cuenta?.fecha_emision && form.fechaPago < props.cuenta.fecha_emision) {
    errores.fechaPago = `No puede ser anterior a la emisión (${props.cuenta.fecha_emision})`
    ok = false
  }

  return ok
}

const duplicadoInfo = ref<DuplicadoPagoInfo | null>(null)
const confirmDuplicadoOpen = ref(false)
const canForzarDuplicado = computed(() =>
  authStore.hasPermission(PermisoBanderas.FINANZAS_FORZAR_DUPLICADO),
)

const ejecutarPago = async (forzar: boolean) => {
  if (mensajeErrorMontoMoneda(form.monto, moneyOpts) || !props.cuenta) return
  const montoFinal = roundMoney(parseMoneyInput(form.monto))

  try {
    await mutation.mutateAsync({
      idCuenta: props.cuenta.id,
      monto: montoFinal,
      fechaPago: form.fechaPago || undefined,
      idMedioPago: form.idMedioPago ? Number(form.idMedioPago) : undefined,
      referencia: form.referencia.trim() || undefined,
      observacion: form.observacion.trim() || undefined,
      idUsuarioAuditoria: authStore.user?.id ?? undefined,
      forzarDuplicado: forzar,
    })
    confirmDuplicadoOpen.value = false
    duplicadoInfo.value = null
    open.value = false
    emit('saved')
  } catch {
    // El toast lo maneja la mutación
  }
}

const submit = async () => {
  if (!props.cuenta) return
  if (mensajeErrorMontoMoneda(form.monto, moneyOpts)) return
  if (!validar()) return

  const monto = roundMoney(parseMoneyInput(form.monto))

  // Chequeo previo de duplicado
  try {
    const info = await finanzasService.verificarDuplicadoPago({
      idCuenta: props.cuenta.id,
      fechaPago: form.fechaPago,
      monto,
      numeroComprobante:
        props.cuenta.comprobante?.trim() ||
        props.cuenta.numero_comprobante?.trim() ||
        undefined,
    })
    if (info.duplicado) {
      duplicadoInfo.value = info
      confirmDuplicadoOpen.value = true
      return
    }
  } catch {
    // Si el chequeo falla, seguimos: el backend volverá a chequear.
  }

  await ejecutarPago(false)
}

const forzarPagoDuplicado = () => ejecutarPago(true)
</script>
