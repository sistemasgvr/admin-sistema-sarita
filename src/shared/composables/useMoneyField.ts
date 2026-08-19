import { computed, ref, watch, type Ref } from 'vue'
import {
  esMontoMonedaValido,
  mensajeErrorMontoMoneda,
  parseMoneyInput,
  roundMoney,
  type ValidacionMontoMonedaOpts,
} from '@/shared/utils/currency'

/**
 * Validación reactiva para un campo de monto PEN (string v-model).
 * No redondea valores con más de 2 decimales; expone error y estado válido.
 */
export function useMoneyField(
  model: Ref<string | undefined>,
  opts: ValidacionMontoMonedaOpts = {},
) {
  const error = ref('')

  const valido = computed(() => esMontoMonedaValido(model.value ?? '', opts))

  watch(
    model,
    (v) => {
      error.value = mensajeErrorMontoMoneda(v ?? '', opts) ?? ''
    },
    { immediate: true },
  )

  /** Formatea a 2 decimales solo si el valor ya es válido; si no, conserva el texto y el error. */
  function onBlur() {
    const raw = model.value ?? ''
    const msg = mensajeErrorMontoMoneda(raw, opts)
    if (msg) {
      error.value = msg
      return
    }
    const n = parseMoneyInput(raw)
    if (n != null) model.value = roundMoney(n).toFixed(2)
  }

  return { error, valido, onBlur }
}
