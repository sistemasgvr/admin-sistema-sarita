import * as yup from 'yup'
import { NUMBER_MIN, NUMBER_STEP } from '@/shared/constants/number-input'

/** Códigos / nombres de U.M. que representan piezas (sin decimales). */
const UNIDADES_ENTERAS = new Set([
  'UNID',
  'NIU',
  'UND',
  'UNI',
  'UNIDAD',
  'UNIDADES',
  'PZ',
  'PZA',
  'PIEZA',
  'PIEZAS',
])

export const MSG_CANTIDAD_UNID_ENTERA = 'UNID no admite cantidades decimales'

export function normalizarNombreUnidadMedida(nombre?: string | null): string {
  return (nombre ?? '')
    .trim()
    .toUpperCase()
    .replace(/\.+$/, '')
}

export function unidadRequiereCantidadEntera(nombreUnidad?: string | null): boolean {
  return UNIDADES_ENTERAS.has(normalizarNombreUnidadMedida(nombreUnidad))
}

export function stepCantidadPorUnidad(nombreUnidad?: string | null): string {
  return unidadRequiereCantidadEntera(nombreUnidad) ? NUMBER_STEP.unit : NUMBER_STEP.measure
}

/**
 * Step del input: `any` evita el tooltip nativo del navegador;
 * la validación (vee-validate / yup) marca el error en el campo.
 */
export function stepInputCantidadPorUnidad(_nombreUnidad?: string | null): string {
  return 'any'
}

export function minCantidadPorUnidad(nombreUnidad?: string | null): string {
  return unidadRequiereCantidadEntera(nombreUnidad)
    ? NUMBER_MIN.unit
    : NUMBER_MIN.measurePositive
}

/** true si la cantidad es un entero positivo (tolera 1.0). */
export function esCantidadEntera(cantidad: number): boolean {
  if (!Number.isFinite(cantidad) || cantidad <= 0) return false
  return Math.abs(cantidad - Math.round(cantidad)) < 1e-9
}

/**
 * Valida cantidad según U.M. Devuelve mensaje de error o null si es válida.
 */
export function validarCantidadSegunUnidad(
  cantidad: number,
  nombreUnidad?: string | null,
  etiquetaProducto?: string,
): string | null {
  if (!Number.isFinite(cantidad) || cantidad <= 0) {
    return 'La cantidad debe ser mayor a cero'
  }
  if (unidadRequiereCantidadEntera(nombreUnidad) && !esCantidadEntera(cantidad)) {
    const nombre = etiquetaProducto?.trim() || 'este producto'
    return `${nombre}: ${MSG_CANTIDAD_UNID_ENTERA}`
  }
  return null
}

/** Schema yup para vee-validate (AppInput `:error`). */
export function cantidadPorUnidadMedidaSchema(nombreUnidad?: string | null) {
  const base = yup
    .number()
    .transform((_value, originalValue) => {
      if (originalValue === '' || originalValue == null) return undefined
      const n = typeof originalValue === 'number' ? originalValue : Number(originalValue)
      return Number.isFinite(n) ? n : undefined
    })
    .typeError('Ingresa una cantidad válida')
    .moreThan(0, 'La cantidad debe ser mayor a cero')
    .required('La cantidad es obligatoria')

  if (unidadRequiereCantidadEntera(nombreUnidad)) {
    return base.integer(MSG_CANTIDAD_UNID_ENTERA)
  }
  return base
}
