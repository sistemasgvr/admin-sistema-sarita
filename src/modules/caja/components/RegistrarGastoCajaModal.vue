<template>
  <AppModal v-model="open" title="Registrar gasto de caja" size="md">
    <div class="space-y-4">
      <AppFormField label="Concepto" required :error="errores.concepto">
        <AppInput v-model="form.concepto" placeholder="Combustible, flete, vigilancia..." />
      </AppFormField>
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <AppFormField label="Monto" required :error="errores.monto">
          <AppInput v-model="form.monto" type="text" inputmode="decimal" placeholder="0.00" />
        </AppFormField>
        <AppFormField label="Medio de pago" optional>
          <AppSelect v-model="form.idMedioPago" :options="medioOptions" placeholder="Efectivo / Yape..." />
        </AppFormField>
      </div>
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
        class="flex w-full justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-70 sm:w-auto"
        :disabled="guardando"
        @click="submit"
      >
        {{ guardando ? 'Guardando...' : 'Registrar gasto' }}
      </button>
    </template>
  </AppModal>
</template>

<script setup lang="ts">
import { computed, reactive, watch } from 'vue'
import { AppInput, AppModal, AppSelect, AppTextarea } from '@/shared/components'
import AppFormField from '@/shared/components/form/AppFormField.vue'
import { useCrearCajaGastoMutation } from '@/modules/caja/composables/useCajaQuery'
import { useMediosPagoQuery } from '@/modules/finanzas/composables/useMediosPagoQuery'
import { parseMoneyInput } from '@/shared/utils/currency'
import type { SelectOption } from '@/shared/interfaces/form.interface'

const open = defineModel<boolean>({ default: false })
const props = defineProps<{ fecha: string; idSesion?: number | null }>()
const emit = defineEmits<{ saved: [] }>()

const form = reactive({
  concepto: '',
  monto: '',
  idMedioPago: null as number | null,
  numeroOperacion: '',
  observacion: '',
})
const errores = reactive({ concepto: '', monto: '' })
const mutation = useCrearCajaGastoMutation()
const mediosQuery = useMediosPagoQuery()
const guardando = computed(() => mutation.isPending.value)
const medioOptions = computed<SelectOption[]>(() =>
  (mediosQuery.data.value ?? []).map((m) => ({ value: m.id, label: m.nombre })),
)

watch(open, (v) => {
  if (v) {
    form.concepto = ''
    form.monto = ''
    form.idMedioPago = null
    form.numeroOperacion = ''
    form.observacion = ''
    errores.concepto = ''
    errores.monto = ''
  }
})

async function submit() {
  errores.concepto = form.concepto.trim() ? '' : 'Obligatorio'
  const monto = parseMoneyInput(form.monto)
  errores.monto = monto != null && monto > 0 ? '' : 'Monto inválido'
  if (errores.concepto || errores.monto) return

  await mutation.mutateAsync({
    fecha: props.fecha,
    concepto: form.concepto.trim(),
    monto: monto!,
    idMedioPago: form.idMedioPago,
    numeroOperacion: form.numeroOperacion || undefined,
    observacion: form.observacion || undefined,
    idSesion: props.idSesion ?? undefined,
  })
  open.value = false
  emit('saved')
}
</script>
