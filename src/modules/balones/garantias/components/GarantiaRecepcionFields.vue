<template>
  <div
    class="space-y-3"
    :class="
      bare
        ? ''
        : 'rounded-xl border border-amber-200 bg-amber-50/40 p-3 dark:border-amber-500/30 dark:bg-amber-500/10'
    "
  >
    <p v-if="!bare" class="text-xs font-medium text-amber-800 dark:text-amber-200">
      Recepción de la garantía
    </p>
    <MedioPagoCuentaField
      v-model:id-medio-pago="idMedioPagoNumerico"
      v-model:id-cuenta-bancaria="idCuentaBancaria"
      v-model:numero-operacion="numeroOperacion"
      v-model:valido="valido"
      label-medio="Medio de recepción"
      medio-requerido
      excluir-credito
      numero-operacion-opcional
      :disabled="disabled"
    />
    <AppInput
      v-model="observacion"
      label="Comentario"
      placeholder="Ej.: voucher, referencia, quién lo dejó..."
      :disabled="disabled"
      hint="Opcional, pero útil para conciliar el depósito."
    />
  </div>
</template>

<script setup lang="ts">
/**
 * Medio, cuenta y voucher con los que se recibe una garantía.
 *
 * Reutiliza MedioPagoCuentaField en vez de un select suelto porque el backend
 * valida la garantía con la misma regla que un cobro de venta
 * (`fin_validar_cuenta_medio_pago`): un medio con requiere_cuenta_bancaria
 * exige la cuenta de la empresa. Sin este campo, cobrar una garantía por
 * transferencia o billetera era imposible — el backend la rechazaba y en el
 * formulario no había dónde indicarla.
 */
import { computed } from 'vue'
import MedioPagoCuentaField from '@/modules/finanzas/components/MedioPagoCuentaField.vue'
import { AppInput } from '@/shared/components'

defineProps<{
  disabled?: boolean
  /** Sin marco ni título: el contenedor ya aporta los suyos. */
  bare?: boolean
}>()

const idMedioPago = defineModel<string | number>('idMedioPago', { default: '' })
const idCuentaBancaria = defineModel<number | null>('idCuentaBancaria', { default: null })
const numeroOperacion = defineModel<string>('numeroOperacion', { default: '' })
const observacion = defineModel<string>('observacion', { default: '' })
/** El contenedor lo usa para bloquear su botón de guardar. */
const valido = defineModel<boolean>('valido', { default: true })

/**
 * Los formularios que ya usaban este componente guardan el medio como
 * `string | number` (cadena vacía = sin elegir). MedioPagoCuentaField trabaja
 * con `number | null`, así que se traduce aquí en vez de tocar cada llamador.
 */
const idMedioPagoNumerico = computed<number | null>({
  get: () => (idMedioPago.value === '' ? null : Number(idMedioPago.value)),
  set: (value) => {
    idMedioPago.value = value ?? ''
  },
})
</script>
