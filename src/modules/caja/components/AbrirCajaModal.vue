<template>
  <AppModal v-model="open" title="Abrir caja" size="md">
    <div class="space-y-4">
      <p class="text-theme-sm text-gray-500 dark:text-gray-400">
        Primer paso del día operativo. Indica el efectivo con el que inicia la caja (fondo).
      </p>
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <AppFormField label="Fecha" required>
          <AppInput v-model="form.fecha" type="date" />
        </AppFormField>
        <AppFormField label="Monto inicial" required :error="errorMonto">
          <AppInput v-model="form.montoInicial" type="text" inputmode="decimal" placeholder="0.00" />
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
        class="flex w-full justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-70 sm:w-auto"
        :disabled="guardando"
        @click="submit"
      >
        {{ guardando ? 'Abriendo...' : 'Abrir caja' }}
      </button>
    </template>
  </AppModal>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { AppInput, AppModal, AppTextarea } from '@/shared/components'
import AppFormField from '@/shared/components/form/AppFormField.vue'
import { useAbrirCajaMutation } from '@/modules/caja/composables/useCajaQuery'
import { parseMoneyInput } from '@/shared/utils/currency'

const open = defineModel<boolean>({ default: false })
const props = defineProps<{ fecha: string }>()
const emit = defineEmits<{ saved: [] }>()

const form = reactive({
  fecha: props.fecha,
  montoInicial: '0',
  observacion: '',
})
const errorMonto = ref('')
const mutation = useAbrirCajaMutation()
const guardando = computed(() => mutation.isPending.value)

watch(open, (v) => {
  if (v) {
    form.fecha = props.fecha
    form.montoInicial = '0'
    form.observacion = ''
    errorMonto.value = ''
  }
})

async function submit() {
  const monto = parseMoneyInput(form.montoInicial)
  if (monto == null || monto < 0) {
    errorMonto.value = 'Monto inválido'
    return
  }
  errorMonto.value = ''
  await mutation.mutateAsync({
    fecha: form.fecha,
    montoInicial: monto,
    observacion: form.observacion || undefined,
  })
  open.value = false
  emit('saved')
}
</script>
