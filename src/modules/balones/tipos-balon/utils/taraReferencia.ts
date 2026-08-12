/**
 * Rangos de peso tara (cilindro vacío) de referencia según capacidad de gas.
 * No se persiste categoría; solo guía operativa al cargar tipos.
 *
 * Fuentes típicas (acero/aluminio medicinal-industrial):
 * - D/E (~682 L ≈ 0.68 m³): 2.5–3.4 kg
 * - Mediano 2–4 m³: 13–28 kg
 * - Grande ~6 m³: 36–46 kg
 * - 10 m³: 50–55 kg vacío
 */

export type CategoriaTaraReferencia =
  | 'portatil'
  | 'mediano'
  | 'grande'
  | 'industrial'

export interface TaraReferencia {
  categoria: CategoriaTaraReferencia
  /** Etiqueta corta para UI */
  label: string
  minKg: number
  maxKg: number
  /** Descripción del tramo de capacidad */
  capacidadHint: string
}

const BANDS: Array<{
  maxM3Exclusive: number | null
  categoria: CategoriaTaraReferencia
  label: string
  minKg: number
  maxKg: number
  capacidadHint: string
}> = [
  {
    maxM3Exclusive: 1.5,
    categoria: 'portatil',
    label: 'D/E (portátil)',
    minKg: 2.5,
    maxKg: 3.4,
    capacidadHint: 'tipo D/E ~0.68 m³',
  },
  {
    maxM3Exclusive: 5,
    categoria: 'mediano',
    label: 'Mediano',
    minKg: 13,
    maxKg: 28,
    capacidadHint: 'típico 2–4 m³',
  },
  {
    maxM3Exclusive: 8,
    categoria: 'grande',
    label: 'Grande',
    minKg: 36,
    maxKg: 46,
    capacidadHint: 'típico ~6 m³',
  },
  {
    maxM3Exclusive: null,
    categoria: 'industrial',
    label: '10m³',
    minKg: 50,
    maxKg: 55,
    capacidadHint: 'industrial/medicinal grande ~10 m³',
  },
]

/** Resuelve banda de tara esperada a partir de capacidad en m³. */
export function taraReferenciaPorCapacidadM3(m3: number | null | undefined): TaraReferencia | null {
  if (m3 == null || !Number.isFinite(m3) || m3 < 0) return null
  for (const band of BANDS) {
    if (band.maxM3Exclusive == null || m3 < band.maxM3Exclusive) {
      return {
        categoria: band.categoria,
        label: band.label,
        minKg: band.minKg,
        maxKg: band.maxKg,
        capacidadHint: band.capacidadHint,
      }
    }
  }
  return null
}

export function taraDentroDeReferencia(
  pesoKg: number | null | undefined,
  ref: TaraReferencia | null,
): boolean | null {
  if (ref == null || pesoKg == null || !Number.isFinite(pesoKg)) return null
  return pesoKg >= ref.minKg && pesoKg <= ref.maxKg
}

export function textoTaraReferencia(ref: TaraReferencia): string {
  return `${ref.label}: tara típica ${ref.minKg}–${ref.maxKg} kg (${ref.capacidadHint}).`
}
