/**
 * Código interno de venta sin documento (nota de venta histórica).
 * En BD `gen_lista_opciones.descripcion` = `NV` (nombre puede ser NOTA_VENTA).
 * UI: "Venta sin documento". Se acepta `VSD` por compatibilidad con rename parcial.
 */
export const CODIGO_VENTA_SIN_DOC = 'NV'

/** Alias legacy del rename incompleto NV → VSD. */
const CODIGOS_VENTA_SIN_DOC = new Set(['NV', 'VSD'])

export function esNotaVentaCodigo(codigo?: string | null): boolean {
  return CODIGOS_VENTA_SIN_DOC.has((codigo ?? '').trim().toUpperCase())
}

export function esVentaSinDocumentoTipo(opts: {
  codigo?: string | null
  nombre?: string | null
}): boolean {
  if (esNotaVentaCodigo(opts.codigo)) return true
  const nombre = (opts.nombre ?? '').toUpperCase()
  return (
    nombre.includes('NOTA_VENTA') ||
    nombre.includes('NOTA DE VENTA') ||
    nombre.includes('VENTA SIN DOCUMENTO') ||
    nombre.includes('VENTA_SIN_DOCUMENTO')
  )
}

export const LABEL_VENTA_SIN_DOCUMENTO = 'Venta sin documento'
