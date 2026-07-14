/**
 * Etiqueta legible para valores de gen_lista_opciones.
 * Prefiere descripcion de BD cuando es texto humano.
 * Si descripcion es un código SUNAT/numérico (01, 03, 10…), formatea el nombre
 * y opcionalmente deja el código entre paréntesis.
 */
export function formatListaOpcionLabel(
  nombre?: string | null | unknown,
  descripcion?: string | null | unknown,
): string {
  const desc = typeof descripcion === 'string' ? descripcion.trim() : ''
  const code = typeof nombre === 'string' ? nombre.trim() : ''
  const descripcionEsCodigo = Boolean(desc) && /^[0-9]{1,6}$/.test(desc)

  if (desc && !descripcionEsCodigo) return desc

  if (!code) return desc

  const normalized = code.includes('_')
    ? code.toLowerCase().replace(/_/g, ' ')
    : code.toLowerCase()

  const label = normalized.charAt(0).toUpperCase() + normalized.slice(1)

  if (descripcionEsCodigo) return `${label} (${desc})`

  return label
}
