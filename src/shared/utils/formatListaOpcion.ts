/**
 * Etiqueta legible para valores de gen_lista_opciones.
 * Prefiere descripcion de BD; si no, convierte CODIGO_CON_GUIONES a texto.
 */
export function formatListaOpcionLabel(
  nombre?: string | null | unknown,
  descripcion?: string | null | unknown,
): string {
  const desc = typeof descripcion === 'string' ? descripcion.trim() : ''
  if (desc) return desc

  const code = typeof nombre === 'string' ? nombre.trim() : ''
  if (!code) return ''

  const normalized = code.includes('_')
    ? code.toLowerCase().replace(/_/g, ' ')
    : code.toLowerCase()

  return normalized.charAt(0).toUpperCase() + normalized.slice(1)
}
