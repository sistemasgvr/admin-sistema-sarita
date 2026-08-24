import * as yup from 'yup'
import {
  mensajeErrorMontoMoneda,
  type ValidacionMontoMonedaOpts,
} from '@/shared/utils/currency'

export type YupMontoMonedaOpts = ValidacionMontoMonedaOpts & {
  /** Si true, vacío es válido (default false). */
  optional?: boolean
}

/** Esquema Yup para campos de monto PEN (string). */
export function yupMontoMoneda(opts: YupMontoMonedaOpts = {}) {
  const { optional = false, ...moneyOpts } = opts
  return yup
    .string()
    .transform((v) => (v == null ? '' : String(v)))
    .test('monto-moneda', function (value) {
      const texto = value ?? ''
      if (!texto.trim()) {
        if (optional) return true
        return this.createError({ message: 'Monto obligatorio' })
      }
      const msg = mensajeErrorMontoMoneda(texto, moneyOpts)
      if (msg) return this.createError({ message: msg })
      return true
    })
}

/** Esquema Yup para campos numéricos legacy convertidos a validación de moneda. */
export function yupNumeroMoneda(opts: YupMontoMonedaOpts = {}) {
  const { optional = false, ...moneyOpts } = opts
  return yup
    .mixed<number | string>()
    .transform((v) => (v == null || v === '' ? undefined : v))
    .test('numero-moneda', function (value) {
      if (value == null || value === '') {
        if (optional) return true
        return this.createError({ message: 'Monto obligatorio' })
      }
      const msg = mensajeErrorMontoMoneda(String(value), moneyOpts)
      if (msg) return this.createError({ message: msg })
      return true
    })
}
