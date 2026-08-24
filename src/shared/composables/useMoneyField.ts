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
  const enfocado = ref(false)

  const valido = computed(() => esMontoMonedaValido(model.value ?? '', opts))

  function actualizarError() {
    const v = model.value ?? ''
    if (enfocado.value && !v.trim()) {
      error.value = ''
      return
    }
    error.value = mensajeErrorMontoMoneda(v, opts) ?? ''
  }

  watch(model, actualizarError, { immediate: true })

  function onFocus() {
    enfocado.value = true
    actualizarError()
  }

  /** Formatea a 2 decimales solo si el valor ya es válido; si no, conserva el texto y el error. */
  function onBlur() {
    enfocado.value = false
    const raw = model.value ?? ''
    const msg = mensajeErrorMontoMoneda(raw, opts)
    if (msg) {
      error.value = msg
      return
    }
    const n = parseMoneyInput(raw)
    if (n != null) model.value = roundMoney(n).toFixed(2)
    actualizarError()
  }

  return { error, valido, onBlur, onFocus }
}
