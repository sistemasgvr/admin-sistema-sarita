/**
 * Correcciones ortográficas al humanizar códigos UPPER_SNAKE
 * (p. ej. ENTRADA_DEVOLUCION → "Entrada devolución").
 */
const SPANISH_TOKEN_FIXES: Record<string, string> = {
  hidrostatica: 'hidrostática',
  devolucion: 'devolución',
  prestamo: 'préstamo',
  prestamos: 'préstamos',
  operacion: 'operación',
  operaciones: 'operaciones',
  recepcion: 'recepción',
  certificacion: 'certificación',
  recertificacion: 'recertificación',
  reparacion: 'reparación',
  valvula: 'válvula',
  almacen: 'almacén',
  almacenes: 'almacenes',
  vacio: 'vacío',
  vacia: 'vacía',
  transito: 'tránsito',
  numero: 'número',
  codigo: 'código',
  credito: 'crédito',
  debito: 'débito',
  remision: 'remisión',
  fisico: 'físico',
  fisica: 'física',
  electronico: 'electrónico',
  electronica: 'electrónica',
  publico: 'público',
  publica: 'pública',
  organo: 'órgano',
  tipografico: 'tipográfico',
  tipografica: 'tipográfica',
}

function applySpanishAccentFixes(text: string): string {
  return text.replace(/[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+/g, (token) => {
    const lower = token.toLocaleLowerCase('es')
    const fixed = SPANISH_TOKEN_FIXES[lower]
    if (!fixed) return token

    if (token.length > 1 && token === token.toLocaleUpperCase('es')) {
      return fixed.toLocaleUpperCase('es')
    }
    if (token[0] === token[0].toLocaleUpperCase('es')) {
      return fixed.charAt(0).toLocaleUpperCase('es') + fixed.slice(1)
    }
    return fixed
  })
}

function looksLikeListaCode(value: string): boolean {
  return /^[A-Z][A-Z0-9_]*$/.test(value)
}

function humanizeListaCode(code: string): string {
  if (code.length <= 4 && !code.includes('_')) return code

  const normalized = code.includes('_')
    ? code.toLowerCase().replace(/_/g, ' ')
    : code.toLowerCase()
  const withAccents = applySpanishAccentFixes(normalized)
  return withAccents.charAt(0).toUpperCase() + withAccents.slice(1)
}

/** Etiqueta de catálogo usable: corta, sin aclaraciones entre paréntesis. */
function descripcionEsCortaYClara(desc: string): boolean {
  if (!desc || /^[0-9]{1,6}$/.test(desc)) return false
  if (desc.length > 28) return false
  if (/[/(]| — | \/ /.test(desc)) return false
  return true
}

/**
 * Etiqueta legible para valores de gen_lista_opciones.
 * Prefiere descripcion corta (Vacío, Mostrador…). Si es un código SUNAT
 * numérico, lo deja entre paréntesis. Si la descripcion es un párrafo,
 * humaniza el código (EN_ALMACEN → En almacén).
 */
export function formatListaOpcionLabel(
  nombre?: string | null | unknown,
  descripcion?: string | null | unknown,
): string {
  const desc = typeof descripcion === 'string' ? descripcion.trim() : ''
  const code = typeof nombre === 'string' ? nombre.trim() : ''
  const descripcionEsCodigo = Boolean(desc) && /^[0-9]{1,6}$/.test(desc)

  if (descripcionEsCodigo && code) {
    return `${humanizeListaCode(code)} (${desc})`
  }

  if (descripcionEsCortaYClara(desc)) return desc

  if (looksLikeListaCode(code)) {
    return humanizeListaCode(code)
  }

  if (desc) return desc
  if (!code) return ''

  return humanizeListaCode(code)
}
