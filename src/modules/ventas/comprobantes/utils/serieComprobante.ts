/**
 * Reglas de serie para comprobantes electrónicos SUNAT (Perú).
 * Códigos: 01 Factura, 03 Boleta, 07 NC, 08 ND.
 *
 * Prefijos habituales (serie de 4 caracteres):
 * - 01 → F### (F001)
 * - 03 → B### (B001)
 * - 07 → FC## / BC## según familia del documento origen
 * - 08 → FD## / BD## según familia del documento origen
 *
 * Interno (no CPE):
 * - VSD → VSD## (VSD01, 5 caracteres). Legacy NV → NV## (NV01).
 */

export type CodigoTipoComprobanteSunat = '01' | '03' | '07' | '08' | '09' | string

export interface ReglaSerieComprobante {
  codigo: string
  nombre: string
  /** Serie sugerida al cambiar de tipo (sin origen). */
  serieDefault: string
  /** Letras iniciales permitidas (1er caracter de la serie). */
  prefijosPermitidos: string[]
  /** Mensaje si el prefijo no coincide. */
  mensajePrefijo: string
  /** Factura y notas de familia F exigen RUC. */
  requiereRuc: boolean | 'segun_serie'
}

export const REGLAS_SERIE_COMPROBANTE: Record<string, ReglaSerieComprobante> = {
  '01': {
    codigo: '01',
    nombre: 'FACTURA',
    serieDefault: 'F001',
    prefijosPermitidos: ['F'],
    mensajePrefijo: 'Para FACTURA la serie debe empezar con F (ej. F001)',
    requiereRuc: true,
  },
  '03': {
    codigo: '03',
    nombre: 'BOLETA',
    serieDefault: 'B001',
    prefijosPermitidos: ['B'],
    mensajePrefijo: 'Para BOLETA la serie debe empezar con B (ej. B001)',
    requiereRuc: false,
  },
  '07': {
    codigo: '07',
    nombre: 'NOTA DE CRÉDITO',
    serieDefault: 'FC01',
    prefijosPermitidos: ['F', 'B'],
    mensajePrefijo:
      'Para NOTA DE CRÉDITO la serie debe empezar con F o B según el comprobante origen (ej. FC01 / BC01)',
    requiereRuc: 'segun_serie',
  },
  '08': {
    codigo: '08',
    nombre: 'NOTA DE DÉBITO',
    serieDefault: 'FD01',
    prefijosPermitidos: ['F', 'B'],
    mensajePrefijo:
      'Para NOTA DE DÉBITO la serie debe empezar con F o B según el comprobante origen (ej. FD01 / BD01)',
    requiereRuc: 'segun_serie',
  },
  '09': {
    codigo: '09',
    nombre: 'GUÍA DE REMISIÓN',
    serieDefault: 'T001',
    prefijosPermitidos: ['T'],
    mensajePrefijo: 'Para GUÍA DE REMISIÓN la serie debe empezar con T (ej. T001)',
    requiereRuc: false,
  },
  VSD: {
    codigo: 'VSD',
    nombre: 'VENTA SIN DOCUMENTO',
    serieDefault: 'VSD01',
    prefijosPermitidos: ['V'],
    mensajePrefijo: 'Para VENTA SIN DOCUMENTO la serie debe ser VSD## (ej. VSD01)',
    requiereRuc: false,
  },
}

function correlativoSerieDesde(serieActual: string, length = 2): string {
  const digits = serieActual.replace(/\D/g, '') || '1'.padStart(length, '0')
  return digits.slice(-length).padStart(length, '0')
}

function esCodigoVentaSinDocumento(codigo: string): boolean {
  return codigo === 'VSD' || codigo === 'NV'
}

/**
 * Serie por defecto al cambiar tipo.
 * @param serieOrigen Serie del comprobante afectado (para NC/ND): define familia F/B.
 */
export function seriePorDefectoDesdeCodigo(
  codigoTipo: string,
  serieActual = '',
  serieOrigen?: string | null,
): string {
  const codigo = codigoTipo.trim()
  const actual = serieActual.trim().toUpperCase()
  const origen = (serieOrigen ?? '').trim().toUpperCase()
  const familia =
    origen.startsWith('B') ? 'B' : origen.startsWith('F') ? 'F' : actual.startsWith('B') ? 'B' : 'F'

  if (codigo === '01') {
    return `F${correlativoSerieDesde(actual || '001', 3)}`
  }

  if (codigo === '03') {
    return `B${correlativoSerieDesde(actual || '001', 3)}`
  }

  if (codigo === '07') {
    const num = correlativoSerieDesde(actual.replace(/^[FB]?C?/i, '') || '01', 2)
    return `${familia}C${num}`
  }

  if (codigo === '08') {
    const num = correlativoSerieDesde(actual.replace(/^[FB]?D?/i, '') || '01', 2)
    return `${familia}D${num}`
  }

  if (codigo === '09') {
    return `T${correlativoSerieDesde(actual || '001', 3)}`
  }

  if (esCodigoVentaSinDocumento(codigo)) {
    const digits = actual.replace(/^(VSD|NV)/i, '') || '01'
    return `VSD${correlativoSerieDesde(digits, 2)}`
  }

  const regla = REGLAS_SERIE_COMPROBANTE[codigo]
  return regla?.serieDefault ?? (actual || 'B001')
}

export function reglaSeriePorCodigo(codigoTipo: string): ReglaSerieComprobante | null {
  const codigo = codigoTipo.trim()
  if (codigo === 'NV') return REGLAS_SERIE_COMPROBANTE.VSD
  return REGLAS_SERIE_COMPROBANTE[codigo] ?? null
}

export function validarSerieParaTipo(
  codigoTipo: string,
  serie: string,
  serieOrigen?: string | null,
): string | null {
  const serieUpper = serie.trim().toUpperCase()
  const codigo = codigoTipo.trim()
  const regla = reglaSeriePorCodigo(codigo)

  if (!serieUpper) return 'La serie es obligatoria'
  if (!regla) return null

  if (esCodigoVentaSinDocumento(codigo)) {
    if (serieUpper.startsWith('VSD') && serieUpper.length === 5) return null
    if (serieUpper.startsWith('NV') && serieUpper.length === 4) return null
    return regla.mensajePrefijo
  }

  if (serieUpper.length !== 4) {
    return `La serie de ${regla.nombre} debe tener 4 caracteres (ej. ${regla.serieDefault})`
  }

  const primer = serieUpper.charAt(0)

  if (!regla.prefijosPermitidos.includes(primer)) {
    return regla.mensajePrefijo
  }

  // NC/ND: la familia (F/B) debe alinearse al comprobante origen
  if ((codigo === '07' || codigo === '08') && serieOrigen) {
    const familiaOrigen = serieOrigen.trim().toUpperCase().charAt(0)
    if (familiaOrigen && ['F', 'B'].includes(familiaOrigen) && primer !== familiaOrigen) {
      return `La serie de la nota debe iniciar con ${familiaOrigen} igual que el comprobante origen (${serieOrigen})`
    }
  }

  return null
}

export function tipoRequiereRuc(codigoTipo: string, serie?: string): boolean {
  const regla = reglaSeriePorCodigo(codigoTipo)
  if (!regla) return false

  if (regla.requiereRuc === true) return true
  if (regla.requiereRuc === 'segun_serie') {
    return (serie ?? '').trim().toUpperCase().startsWith('F')
  }

  return false
}
