import type { RouteLocationRaw } from 'vue-router'

/**
 * Resuelve la ruta FE para el documento origen de un movimiento unificado.
 * `codigo` = gen_lista_opciones.nombre (TipoDocumentoRef).
 */
export function resolveDocumentoOrigenRoute(
  codigo: string | null | undefined,
  id: number | null | undefined,
): RouteLocationRaw | null {
  if (!codigo || id == null || !Number.isFinite(Number(id)) || Number(id) <= 0) {
    return null
  }

  const docId = Number(id)
  const code = codigo.trim().toUpperCase()

  switch (code) {
    case 'FACTURA':
    case 'BOLETA':
    case 'NOTA_CREDITO':
    case 'NOTA_DEBITO':
    case 'NOTA_VENTA':
      return { name: 'admin-ventas-comprobantes', query: { id: String(docId) } }
    case 'GRE':
      return { name: 'admin-ventas-guias-remision', query: { id: String(docId) } }
    case 'COMPRA':
    case 'DEVOLUCION':
      return { name: 'admin-compras-detalle', params: { id: String(docId) } }
    case 'PRESTAMO':
      return { name: 'admin-balones-prestamos', query: { id: String(docId) } }
    case 'ALQUILER':
      return { name: 'admin-balones-alquileres', query: { id: String(docId) } }
    case 'RECARGA':
      return { name: 'admin-balones-recargas', query: { id: String(docId) } }
    case 'MANTENIMIENTO':
      return { name: 'admin-balones-mantenimientos-editar', params: { id: String(docId) } }
    default:
      return null
  }
}

export function formatDocumentoOrigenLabel(
  codigo: string | null | undefined,
  id: number | null | undefined,
): string {
  if (!codigo && (id == null || id <= 0)) return '—'
  if (!codigo) return `#${id}`
  if (id == null || id <= 0) return codigo
  return `${codigo} #${id}`
}
