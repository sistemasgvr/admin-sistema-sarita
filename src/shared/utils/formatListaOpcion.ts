/**
 * Correcciones ortográficas al humanizar códigos UPPER_SNAKE
 * (p. ej. ENTRADA_DEVOLUCION → "Entrada devolución").
 * Los desplegables usan `descripcion` de BD; las listas suelen traer solo `nombre`.
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

  const withAccents = applySpanishAccentFixes(normalized)
  const label = withAccents.charAt(0).toUpperCase() + withAccents.slice(1)

  if (descripcionEsCodigo) return `${label} (${desc})`

  return label
}
