/** Código interno de Nota de venta (no CPE / no SUNAT). */
export const CODIGO_NOTA_VENTA = 'NV'

export function esNotaVentaCodigo(codigo?: string | null): boolean {
  return (codigo ?? '').trim().toUpperCase() === CODIGO_NOTA_VENTA
}
