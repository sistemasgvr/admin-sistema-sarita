/** Código interno de Nota de venta (no CPE / no SUNAT). */
export const CODIGO_VENTA_SIN_DOC = 'VSD'

export function esNotaVentaCodigo(codigo?: string | null): boolean {
  return (codigo ?? '').trim().toUpperCase() === CODIGO_VENTA_SIN_DOC
}
