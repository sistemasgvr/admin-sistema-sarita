export interface NominatimAddressLike {
  road?: string
  house_number?: string
  suburb?: string
  neighbourhood?: string
  quarter?: string
  city_district?: string
  city?: string
  town?: string
  village?: string
  municipality?: string
  county?: string
  province?: string
  state?: string
  state_district?: string
  region?: string
  country?: string
  postcode?: string
}

export interface UbigeoNombresDesdeMapa {
  departamento?: string
  /** Candidatos ordenados de más a menos confiables */
  provincias: string[]
  /** Candidatos ordenados de más a menos confiables */
  distritos: string[]
}

const IGNORAR_PARTES = new Set([
  'peru',
  'perú',
  'pe',
  'lima metropolitana',
  'provincia constitucional del callao',
])

export function normalizarUbigeoTexto(texto: string) {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[-_/]/g, ' ')
    .replace(/\b(departamento|provincia|distrito|de|del|la|las|los|el)\b/gi, ' ')
    .replace(/[^a-z0-9\s]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

function uniqueNombres(...values: Array<string | null | undefined>): string[] {
  const seen = new Set<string>()
  const result: string[] = []
  for (const value of values) {
    const trimmed = value?.trim()
    if (!trimmed) continue
    const key = normalizarUbigeoTexto(trimmed)
    if (!key || seen.has(key)) continue
    if (IGNORAR_PARTES.has(key)) continue
    seen.add(key)
    result.push(trimmed)
  }
  return result
}

/**
 * En Perú, Nominatim varía bastante:
 * - state → departamento
 * - county / province / region → provincia (puede repetir el dpto, ej. Callao)
 * - city / town / suburb → posibles distritos
 * - suburb/quarter a veces son barrios; se prueban como candidatos y el matcher decide
 */
export function extractUbigeoDesdeNominatim(
  address?: NominatimAddressLike | null,
  displayName?: string | null,
): UbigeoNombresDesdeMapa {
  const departamento = address?.state?.trim() || undefined

  const provincias = uniqueNombres(
    address?.county,
    address?.province,
    address?.region,
    // Callao/Lima: a veces county = state; incluir state como candidato de provincia
    departamento,
    address?.state_district,
  )

  const distritos = uniqueNombres(
    address?.city,
    address?.town,
    address?.village,
    address?.municipality,
    address?.city_district,
    address?.suburb,
    address?.neighbourhood,
  )

  // Fallback por display_name solo si faltan piezas clave
  if (displayName?.trim() && (!departamento || provincias.length === 0 || distritos.length === 0)) {
    const parts = displayName
      .split(',')
      .map((part) => part.trim())
      .filter(Boolean)
      .filter((part) => !/^\d{4,6}$/.test(part))
      .filter((part) => !IGNORAR_PARTES.has(normalizarUbigeoTexto(part)))

    if (parts.length >= 3) {
      const deptCandidate = parts[parts.length - 1]
      const provCandidate = parts[parts.length - 2]
      const distCandidate = parts[parts.length - 3]
      return {
        departamento: departamento || deptCandidate,
        provincias: uniqueNombres(...provincias, provCandidate, deptCandidate),
        distritos: uniqueNombres(...distritos, distCandidate),
      }
    }
  }

  return {
    departamento,
    provincias,
    distritos,
  }
}
