<template>
  <AppModal v-model="open" title="Abrir caja" size="md">
    <div class="space-y-4">
      <p class="text-theme-sm text-gray-500 dark:text-gray-400">
        Primer paso del día operativo. Indica el efectivo con el que inicia la caja (fondo). Solo
        puede haber una sesión por fecha.
      </p>
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <AppFormField label="Fecha" required :error="errorFecha">
          <AppInput v-model="form.fecha" type="date" />
        </AppFormField>
        <AppFormField label="Monto inicial" required :error="errorMonto">
          <MoneyInput
            v-model="form.montoInicial"
            placeholder="0.00"
            :state="errorMonto ? 'error' : 'default'"
            @blur="onBlurMonto"
          />
        </AppFormField>
      </div>
      <AppFormField label="Observación de apertura" optional>
        <AppTextarea v-model="form.observacion" :rows="2" placeholder="Opcional" />
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
        {{ guardando ? 'Abriendo...' : 'Abrir caja' }}
      </button>
    </template>
  </AppModal>
</template>

<script setup lang="ts">
import { computed, reactive, ref, toRef, watch } from 'vue'
import { AppInput, AppModal, AppTextarea, MoneyInput } from '@/shared/components'
import AppFormField from '@/shared/components/form/AppFormField.vue'
import { useAbrirCajaMutation } from '@/modules/caja/composables/useCajaQuery'
import { cajaService } from '@/modules/caja/services/caja.service'
import { useMoneyField } from '@/shared/composables/useMoneyField'
import { mensajeErrorMontoMoneda, parseMoneyInput, roundMoney } from '@/shared/utils/currency'
import { toastSuccess, toastWarning } from '@/shared/composables/useToast'
import { formatDateTime } from '@/shared/utils/date'

const open = defineModel<boolean>({ default: false })
const props = defineProps<{ fecha: string; idSucursal?: number | null }>()
const emit = defineEmits<{ saved: [] }>()

const form = reactive({
  fecha: props.fecha,
  montoInicial: '',
  observacion: '',
})
const errorFecha = ref('')
const mutation = useAbrirCajaMutation()
const guardando = computed(() => mutation.isPending.value)

const { error: errorMonto, valido: montoValido, onBlur: onBlurMonto } = useMoneyField(
  toRef(form, 'montoInicial'),
  { min: 0, allowZero: true },
)

const formularioValido = computed(
  () => Boolean(form.fecha) && montoValido.value,
)

watch(open, (v) => {
  if (v) {
    form.fecha = props.fecha
    form.montoInicial = ''
    form.observacion = ''
    errorFecha.value = ''
  }
})

async function submit() {
  if (mensajeErrorMontoMoneda(form.montoInicial, { min: 0, allowZero: true })) return
  if (!form.fecha) {
    errorFecha.value = 'La fecha es obligatoria'
    return
  }
  errorFecha.value = ''

  const monto = roundMoney(parseMoneyInput(form.montoInicial))

  try {
    const existente = await cajaService.obtenerDia(form.fecha, props.idSucursal)
    const estadoExistente = existente?.estadoCaja ?? null
    const estaCerrada = estadoExistente === 'CERRADA'
    const estaAbierta = estadoExistente === 'ABIERTA'

    if (existente?.id && estaAbierta) {
      const cuando = existente.fechaApertura
        ? formatDateTime(existente.fechaApertura)
        : form.fecha
      errorFecha.value = `Ya hay sesión el ${cuando}`
      toastWarning(
        `Ya existe una caja para esa fecha (apertura ${cuando}). No se puede repetir.`,
      )
      return
    }

    if (existente?.id && !estaCerrada) {
      const cuando = existente.fechaApertura
        ? formatDateTime(existente.fechaApertura)
        : form.fecha
      errorFecha.value = `Ya hay sesión el ${cuando}`
      toastWarning(
        `Ya existe una caja para esa fecha (apertura ${cuando}). No se puede abrir en este estado.`,
      )
      return
    }

    const reabrir = Boolean(existente?.id && estaCerrada)

    await mutation.mutateAsync({
      fecha: form.fecha,
      montoInicial: monto,
      idSucursal: props.idSucursal ?? undefined,
      observacion: form.observacion || undefined,
    })
    toastSuccess(reabrir ? 'Caja reabierta' : 'Caja abierta')
    open.value = false
    emit('saved')
  } catch {
    // toast en useAbrirCajaMutation.onError
  }
}
</script>
