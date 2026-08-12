<template>
  <AppModal v-model="open" title="Cerrar caja / arqueo" size="md">
    <div class="space-y-4">
      <p class="text-theme-sm text-gray-500 dark:text-gray-400">
        Cierre diario (arqueo Z): cuenta el efectivo físico y compáralo con lo esperado. Si hay
        diferencia, regístrala con una observación.
      </p>
      <p class="text-theme-sm text-gray-500 dark:text-gray-400">
        Caja esperada (según movimientos):
        <strong class="text-gray-800 dark:text-white/90">{{ formatCurrency(cajaEsperada) }}</strong>
      </p>
      <AppFormField label="Efectivo contado" required :error="errorMonto">
        <AppInput v-model="form.monto" type="text" inputmode="decimal" placeholder="0.00" />
      </AppFormField>
      <AppFormField
        label="Observación de cierre"
        :required="requiereObservacion"
        :optional="!requiereObservacion"
        :error="errorObs"
      >
        <AppTextarea
          v-model="form.observacion"
          :rows="2"
          :placeholder="
            requiereObservacion
              ? 'Obligatoria: explica el sobrante o faltante'
              : 'Opcional'
          "
        />
      </AppFormField>
      <p v-if="diferenciaPreview != null" class="text-theme-sm" :class="diffClass">
        Diferencia estimada: {{ formatCurrency(diferenciaPreview) }}
        <span v-if="Math.abs(diferenciaPreview) >= 0.01">
          ({{ diferenciaPreview > 0 ? 'sobrante' : 'faltante' }})
        </span>
      </p>
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
        class="flex w-full justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-70 sm:w-auto"
        :disabled="guardando"
        @click="submit"
      >
        {{ guardando ? 'Cerrando...' : 'Cerrar caja' }}
      </button>
    </template>
  </AppModal>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { AppInput, AppModal, AppTextarea } from '@/shared/components'
import AppFormField from '@/shared/components/form/AppFormField.vue'
import { useCerrarCajaMutation } from '@/modules/caja/composables/useCajaQuery'
import { formatCurrency, parseMoneyInput } from '@/shared/utils/currency'
import { toastApiError, toastSuccess } from '@/shared/composables/useToast'

const open = defineModel<boolean>({ default: false })
const props = defineProps<{ idSesion: number; cajaEsperada: number }>()
const emit = defineEmits<{ saved: [] }>()

const form = reactive({ monto: '', observacion: '' })
const errorMonto = ref('')
const errorObs = ref('')
const mutation = useCerrarCajaMutation()
const guardando = computed(() => mutation.isPending.value)

const diferenciaPreview = computed(() => {
  const m = parseMoneyInput(form.monto)
  if (m == null) return null
  return m - props.cajaEsperada
})

const requiereObservacion = computed(() => {
  const d = diferenciaPreview.value
  return d != null && Math.abs(d) >= 0.01
})

const diffClass = computed(() => {
  const d = diferenciaPreview.value
  if (d == null) return 'text-gray-500'
  if (Math.abs(d) < 0.01) return 'text-success-600'
  return d < 0 ? 'text-error-600' : 'text-warning-600'
})

watch(open, (v) => {
  if (v) {
    form.monto = String(props.cajaEsperada ?? 0)
    form.observacion = ''
    errorMonto.value = ''
    errorObs.value = ''
  }
})

async function submit() {
  const monto = parseMoneyInput(form.monto)
  if (monto == null || monto < 0) {
    errorMonto.value = 'Monto inválido'
    return
  }
  errorMonto.value = ''

  if (requiereObservacion.value && !form.observacion.trim()) {
    errorObs.value = 'Indica el motivo del sobrante o faltante'
    return
  }
  errorObs.value = ''

  try {
    await mutation.mutateAsync({
      id: props.idSesion,
      payload: { montoEfectivoContado: monto, observacion: form.observacion || undefined },
    })
    toastSuccess('Caja cerrada')
    open.value = false
    emit('saved')
  } catch (error) {
    toastApiError(error, 'No se pudo cerrar la caja')
  }
}
</script>
