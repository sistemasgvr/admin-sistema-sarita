<template>
  <AppModal v-model="open" title="Editar fondo al abrir" size="md">
    <div class="space-y-4">
      <p class="text-theme-sm text-gray-500 dark:text-gray-400">
        Corrige el efectivo con el que inició la caja. El efectivo esperado se recalcula y el
        cambio queda en los comentarios de la caja.
      </p>
      <AppFormField label="Fondo al abrir" required :error="errorMonto">
        <MoneyInput
          v-model="form.montoInicial"
          placeholder="0.00"
          :state="errorMonto ? 'error' : 'default'"
          @blur="onBlurMonto"
        />
      </AppFormField>
      <AppFormField label="Motivo" optional>
        <AppTextarea
          v-model="form.observacion"
          :rows="2"
          :maxlength="450"
          placeholder="Opcional"
        />
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
        {{ guardando ? 'Guardando...' : 'Guardar fondo' }}
      </button>
    </template>
  </AppModal>
</template>

<script setup lang="ts">
import { computed, reactive, toRef, watch } from 'vue'
import { AppModal, AppTextarea, MoneyInput } from '@/shared/components'
import AppFormField from '@/shared/components/form/AppFormField.vue'
import { useActualizarFondoCajaMutation } from '@/modules/caja/composables/useCajaQuery'
import { useMoneyField } from '@/shared/composables/useMoneyField'
import { parseMoneyInput, roundMoney } from '@/shared/utils/currency'

const open = defineModel<boolean>({ default: false })
const props = defineProps<{
  idSesion: number
  montoActual: number
}>()

const form = reactive({
  montoInicial: '',
  observacion: '',
})
const mutation = useActualizarFondoCajaMutation()
const guardando = computed(() => mutation.isPending.value)

const {
  error: errorMonto,
  valido: montoValido,
  onBlur: onBlurMonto,
} = useMoneyField(toRef(form, 'montoInicial'), { min: 0, allowZero: true })

const montoNuevo = computed(() => roundMoney(parseMoneyInput(form.montoInicial)))
const formularioValido = computed(
  () => montoValido.value && montoNuevo.value !== roundMoney(props.montoActual),
)

watch(open, (v) => {
  if (v) {
    form.montoInicial = roundMoney(props.montoActual).toFixed(2)
    form.observacion = ''
  }
})

async function submit() {
  if (!formularioValido.value) return
  try {
    await mutation.mutateAsync({
      id: props.idSesion,
      payload: {
        montoInicial: montoNuevo.value,
        observacion: form.observacion.trim() || undefined,
      },
    })
    open.value = false
  } catch {
    // toast en la mutación
  }
}
</script>
