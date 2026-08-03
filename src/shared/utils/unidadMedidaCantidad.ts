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
export const MSG_STOCK_UNID_ENTERO = 'UNID no admite stock decimal'

export function normalizarNombreUnidadMedida(nombre?: string | null): string {
  return (nombre ?? '')
    .trim()
    .toUpperCase()
    .replace(/\.+$/, '')
}

/**
 * Piezas (UNID, NIU, …) exigen enteros.
 * Gases pueden ser decimales aunque la U.M. esté mal catalogada como UNID.
 */
export function unidadRequiereCantidadEntera(
  nombreUnidad?: string | null,
  esGas?: boolean | null,
): boolean {
  if (esGas) return false
  return UNIDADES_ENTERAS.has(normalizarNombreUnidadMedida(nombreUnidad))
}

export function stepCantidadPorUnidad(
  nombreUnidad?: string | null,
  esGas?: boolean | null,
): string {
  return unidadRequiereCantidadEntera(nombreUnidad, esGas)
    ? NUMBER_STEP.unit
    : NUMBER_STEP.measure
}

/**
 * Step del input: `any` evita el tooltip nativo del navegador;
 * la validación (vee-validate / yup) marca el error en el campo.
 */
export function stepInputCantidadPorUnidad(
  _nombreUnidad?: string | null,
  _esGas?: boolean | null,
): string {
  return 'any'
}

export function minCantidadPorUnidad(
  nombreUnidad?: string | null,
  esGas?: boolean | null,
): string {
  return unidadRequiereCantidadEntera(nombreUnidad, esGas)
    ? NUMBER_MIN.unit
    : NUMBER_MIN.measurePositive
}

/** true si la cantidad es un entero (tolera 1.0). Permite 0. */
export function esCantidadEnteraIncluyeCero(cantidad: number): boolean {
  if (!Number.isFinite(cantidad)) return false
  return Math.abs(cantidad - Math.round(cantidad)) < 1e-9
}

/** true si la cantidad es un entero positivo (tolera 1.0). */
export function esCantidadEntera(cantidad: number): boolean {
  if (!Number.isFinite(cantidad) || cantidad <= 0) return false
  return esCantidadEnteraIncluyeCero(cantidad)
}

/**
 * Valida cantidad de venta/movimiento (> 0) según U.M.
 * Devuelve mensaje de error o null si es válida.
 */
export function validarCantidadSegunUnidad(
  cantidad: number,
  nombreUnidad?: string | null,
  etiquetaProducto?: string,
  esGas?: boolean | null,
): string | null {
  if (!Number.isFinite(cantidad) || cantidad <= 0) {
    return 'La cantidad debe ser mayor a cero'
  }
  if (unidadRequiereCantidadEntera(nombreUnidad, esGas) && !esCantidadEntera(cantidad)) {
    const nombre = etiquetaProducto?.trim() || 'este producto'
    return `${nombre}: ${MSG_CANTIDAD_UNID_ENTERA}`
  }
  return null
}

/**
 * Valida stock / stock mínimo (>= 0) según U.M.
 */
export function validarStockSegunUnidad(
  cantidad: number,
  nombreUnidad?: string | null,
  etiquetaCampo = 'La cantidad',
  esGas?: boolean | null,
): string | null {
  if (!Number.isFinite(cantidad) || cantidad < 0) {
    return `${etiquetaCampo} no puede ser negativa`
  }
  if (
    unidadRequiereCantidadEntera(nombreUnidad, esGas) &&
    !esCantidadEnteraIncluyeCero(cantidad)
  ) {
    return `${etiquetaCampo}: ${MSG_STOCK_UNID_ENTERO}`
  }
  return null
}

/** Schema yup para cantidades de venta/movimiento (> 0). */
export function cantidadPorUnidadMedidaSchema(
  nombreUnidad?: string | null,
  esGas?: boolean | null,
) {
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

  if (unidadRequiereCantidadEntera(nombreUnidad, esGas)) {
    return base.integer(MSG_CANTIDAD_UNID_ENTERA)
  }
  return base
}

/** Schema yup para stock / mínimo (>= 0). */
export function stockPorUnidadMedidaSchema(
  nombreUnidad?: string | null,
  etiquetaCampo = 'La cantidad',
  esGas?: boolean | null,
) {
  const base = yup
    .number()
    .transform((_value, originalValue) => {
      if (originalValue === '' || originalValue == null) return undefined
      const n = typeof originalValue === 'number' ? originalValue : Number(originalValue)
      return Number.isFinite(n) ? n : undefined
    })
    .typeError('Ingresa una cantidad válida')
    .min(0, `${etiquetaCampo} no puede ser negativa`)
    .required(`${etiquetaCampo} es obligatoria`)

  if (unidadRequiereCantidadEntera(nombreUnidad, esGas)) {
    return base.integer(`${etiquetaCampo}: ${MSG_STOCK_UNID_ENTERO}`)
  }
  return base
}

export function formatCantidadPorUnidad(
  value: unknown,
  nombreUnidad?: string | null,
  esGas?: boolean | null,
): string {
  const amount = Number(value ?? 0)
  const enteros = unidadRequiereCantidadEntera(nombreUnidad, esGas)
  return new Intl.NumberFormat('es-PE', {
    minimumFractionDigits: 0,
    maximumFractionDigits: enteros ? 0 : 4,
  }).format(amount)
}
