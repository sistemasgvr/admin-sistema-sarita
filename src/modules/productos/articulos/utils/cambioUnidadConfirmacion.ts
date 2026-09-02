import { ApiError } from '@/shared/api/errors/api.error'

/**
 * Detalle que envía la API cuando se intenta cambiar la unidad de medida de un
 * producto que ya tiene stock o movimientos.
 *
 * `pro_stock` no guarda unidad propia: su saldo se lee siempre en la unidad actual
 * del producto, así que cambiarla sin convertir reinterpretaría el saldo (12 KG
 * pasarían a leerse como 12 MT3). La API rechaza el cambio y devuelve estos datos
 * para que el usuario pueda confirmar la conversión con conocimiento de causa.
 */
export interface CambioUnidadConfirmacion {
  stockTotal: number
  almacenesConStock: number
  unidadActual: string | null
  unidadNueva: string | null
  mensaje: string
}

const MOTIVO = 'CAMBIO_UNIDAD_MEDIDA'

/** Devuelve el detalle si el error es una petición de confirmación; si no, null. */
export function leerConfirmacionCambioUnidad(
  error: unknown,
): CambioUnidadConfirmacion | null {
  if (!(error instanceof ApiError) || !error.detalle) return null

  const detalle = error.detalle
  if (detalle.requiereConfirmacion !== true || detalle.motivo !== MOTIVO) return null

  return {
    stockTotal: Number(detalle.stockTotal ?? 0),
    almacenesConStock: Number(detalle.almacenesConStock ?? 0),
    unidadActual: (detalle.unidadActual as string | null) ?? null,
    unidadNueva: (detalle.unidadNueva as string | null) ?? null,
    mensaje: error.message,
  }
}

/** true si el error pide confirmar la conversión del saldo (no es un fallo real). */
export function esConfirmacionCambioUnidad(error: unknown): boolean {
  return leerConfirmacionCambioUnidad(error) !== null
}

/** Formatea una cantidad para el diálogo, sin ceros de relleno. */
export function formatCantidadUnidad(valor: number, unidad?: string | null): string {
  const qty = new Intl.NumberFormat('es-PE', { maximumFractionDigits: 4 }).format(valor)
  const um = unidad?.trim()
  return um ? `${qty} ${um}` : qty
}
