/**
 * Normaliza texto pegado/escrito para buscar serie-número (ej. "B001-00000123").
 */
export function normalizarBusquedaComprobante(value: string): string {
  return value
    .trim()
    .replace(/\s+/g, '')
    .replace(/\//g, '-')
    .toUpperCase()
}
