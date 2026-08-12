/** Conversiones duales para tipo de balón (capacidad + tara). */

export const KG_TO_LB = 2.20462
/** Fallback O₂: m³ de gas por 1 lb (ficha técnica / bal_factor_lb_m3). */
export const DEFAULT_FACTOR_M3_POR_LB = 0.3174
/** Fallback O₂: m³ de gas por 1 kg. */
export const DEFAULT_FACTOR_M3_POR_KG = 0.7

export type UnidadCapacidadKind = 'm3' | 'ltr' | 'lb' | 'kg' | 'other'

export function normalizarCodigoUnidad(nombre?: string | null): string {
  return (nombre ?? '')
    .trim()
    .toUpperCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/³/g, '3')
    .replace(/\s+/g, '')
}

export function kindUnidadCapacidad(nombreUnidad?: string | null): UnidadCapacidadKind {
  const u = normalizarCodigoUnidad(nombreUnidad)
  if (!u) return 'm3'
  if (u === 'MT3' || u === 'M3' || u.includes('METROCUBICO')) return 'm3'
  if (u === 'LTR' || u === 'LT' || u === 'L' || u === 'LITRO' || u === 'LITROS') return 'ltr'
  if (u === 'LB' || u === 'LBR' || u === 'LIBRA' || u === 'LIBRAS') return 'lb'
  if (u === 'KG' || u === 'KGM' || u === 'KILO' || u === 'KILOGRAMO' || u === 'KILOGRAMOS') {
    return 'kg'
  }
  return 'other'
}

export function labelCapacidadPorUnidad(nombreUnidad?: string | null): string {
  switch (kindUnidadCapacidad(nombreUnidad)) {
    case 'm3':
      return 'Capacidad (m³)'
    case 'ltr':
      return 'Capacidad (L)'
    case 'lb':
      return 'Capacidad (lb)'
    case 'kg':
      return 'Capacidad (kg)'
    default:
      return 'Capacidad'
  }
}

export function roundMeasure(value: number, digits = 2): number {
  if (!Number.isFinite(value)) return value
  const f = 10 ** digits
  return Math.round(value * f) / f
}

export function toNumberOrNull(value: unknown): number | null {
  if (value === '' || value == null) return null
  const n = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(n) ? n : null
}

export interface FactoresGas {
  /** m³ por 1 lb */
  factorM3PorLb: number
  /** m³ por 1 kg */
  factorM3PorKg: number
}

export function factoresDesdeProducto(producto?: {
  factor_lb_m3?: number | string | null
  factor_kg_m3?: number | string | null
} | null): FactoresGas {
  const lb = Number(producto?.factor_lb_m3)
  const kg = Number(producto?.factor_kg_m3)
  return {
    factorM3PorLb: Number.isFinite(lb) && lb > 0 ? lb : DEFAULT_FACTOR_M3_POR_LB,
    factorM3PorKg: Number.isFinite(kg) && kg > 0 ? kg : DEFAULT_FACTOR_M3_POR_KG,
  }
}

/** Canonical dual: volumen m³ + masa de gas en lb. */
export function capacidadToCanonical(
  capacidad: number,
  nombreUnidad: string | null | undefined,
  factores: FactoresGas,
): { m3: number; lb: number } | null {
  if (!Number.isFinite(capacidad) || capacidad < 0) return null
  const kind = kindUnidadCapacidad(nombreUnidad)
  switch (kind) {
    case 'm3':
      return {
        m3: capacidad,
        lb: capacidad / factores.factorM3PorLb,
      }
    case 'ltr':
      return {
        m3: capacidad / 1000,
        lb: capacidad / 1000 / factores.factorM3PorLb,
      }
    case 'lb':
      return {
        m3: capacidad * factores.factorM3PorLb,
        lb: capacidad,
      }
    case 'kg':
      return {
        m3: capacidad * factores.factorM3PorKg,
        lb: capacidad * KG_TO_LB,
      }
    default:
      return null
  }
}

export function canonicalToCapacidad(
  canonical: { m3: number; lb: number },
  nombreUnidad: string | null | undefined,
  factores: FactoresGas,
): number | null {
  const kind = kindUnidadCapacidad(nombreUnidad)
  switch (kind) {
    case 'm3':
      return canonical.m3
    case 'ltr':
      return canonical.m3 * 1000
    case 'lb':
      return canonical.lb
    case 'kg':
      return canonical.m3 / factores.factorM3PorKg
    default:
      return null
  }
}

export function lbFromCapacidad(
  capacidad: number,
  nombreUnidad: string | null | undefined,
  factores: FactoresGas,
): number | null {
  const c = capacidadToCanonical(capacidad, nombreUnidad, factores)
  return c ? roundMeasure(c.lb) : null
}

export function capacidadFromLb(
  lb: number,
  nombreUnidad: string | null | undefined,
  factores: FactoresGas,
): number | null {
  if (!Number.isFinite(lb) || lb < 0) return null
  const m3 = lb * factores.factorM3PorLb
  const value = canonicalToCapacidad({ m3, lb }, nombreUnidad, factores)
  return value == null ? null : roundMeasure(value)
}

export function kgToLb(kg: number): number {
  return roundMeasure(kg * KG_TO_LB)
}

export function lbToKg(lb: number): number {
  return roundMeasure(lb / KG_TO_LB)
}

export function unidadSoportaConversionDual(nombreUnidad?: string | null): boolean {
  return kindUnidadCapacidad(nombreUnidad) !== 'other'
}
