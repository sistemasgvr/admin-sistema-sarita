<template>
  <AppModal v-model="open" :title="tituloModal" size="md">
    <div class="space-y-4">
      <p class="text-theme-sm text-gray-500 dark:text-gray-400">
        {{ textoAyuda }}
      </p>
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <AppFormField label="Fecha" required :error="errorFecha">
          <AppInput v-model="form.fecha" type="date" :disabled="esReapertura" />
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
        {{ guardando ? 'Guardando...' : etiquetaConfirmar }}
      </button>
    </template>
  </AppModal>
</template>

<script setup lang="ts">
import { computed, reactive, ref, toRef, watch } from 'vue'
import { AppInput, AppModal, AppTextarea, MoneyInput } from '@/shared/components'
import AppFormField from '@/shared/components/form/AppFormField.vue'
import { useAbrirCajaMutation } from '@/modules/caja/composables/useCajaQuery'
import { useMoneyField } from '@/shared/composables/useMoneyField'
import { mensajeErrorMontoMoneda, parseMoneyInput, roundMoney } from '@/shared/utils/currency'
import { toastApiError, toastSuccess } from '@/shared/composables/useToast'

const open = defineModel<boolean>({ default: false })
const props = defineProps<{
  fecha: string
  idSucursal?: number | null
  esReapertura?: boolean
  idSesion?: number | null
  montoInicialAnterior?: number | null
}>()
const emit = defineEmits<{ saved: [] }>()

const form = reactive({
  fecha: props.fecha,
  montoInicial: '',
  observacion: '',
})
const errorFecha = ref('')
const mutation = useAbrirCajaMutation()
const guardando = computed(() => mutation.isPending.value)

const esReapertura = computed(() => Boolean(props.esReapertura && props.idSesion))
const tituloModal = computed(() => (esReapertura.value ? 'Reabrir caja' : 'Abrir caja'))
const etiquetaConfirmar = computed(() => (esReapertura.value ? 'Reabrir caja' : 'Abrir caja'))
const textoAyuda = computed(() =>
  esReapertura.value
    ? 'La caja de este día ya fue cerrada. Indica el efectivo con el que reinicia la operación.'
    : 'Primer paso del día operativo. Indica el efectivo con el que inicia la caja (fondo). Solo puede haber una sesión por fecha y sucursal.',
)

const { error: errorMonto, valido: montoValido, onBlur: onBlurMonto } = useMoneyField(
  toRef(form, 'montoInicial'),
  { min: 0, allowZero: true },
)

const formularioValido = computed(
  () => Boolean(form.fecha) && montoValido.value && (!esReapertura.value || props.idSesion),
)

watch(open, (v) => {
  if (v) {
    form.fecha = props.fecha
    const prev = props.montoInicialAnterior
    const n = prev != null ? Number(prev) : NaN
    form.montoInicial =
      Number.isFinite(n) && n > 0 ? roundMoney(n).toFixed(2) : ''
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
  if (esReapertura.value && !props.idSesion) {
    toastApiError(new Error('No se encontró la sesión a reabrir'), 'Reabrir caja')
    return
  }
  errorFecha.value = ''

  const monto = roundMoney(parseMoneyInput(form.montoInicial))

  try {
    await mutation.mutateAsync({
      fecha: form.fecha,
      montoInicial: monto,
      idSucursal: props.idSucursal ?? undefined,
      observacion: form.observacion || undefined,
      idSesion: esReapertura.value ? props.idSesion ?? undefined : undefined,
    })
    toastSuccess(esReapertura.value ? 'Caja reabierta' : 'Caja abierta')
    open.value = false
    emit('saved')
  } catch (error) {
    toastApiError(error, esReapertura.value ? 'No se pudo reabrir la caja' : 'No se pudo abrir la caja')
  }
}
</script>
