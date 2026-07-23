import { apiGet } from '@/shared/api/apiClient'
import type {
  Departamento,
  Distrito,
  Pais,
  Provincia,
} from '@/modules/catalogos/interfaces/ubigeo.interface'
import { normalizarUbigeoTexto } from '@/modules/catalogos/utils/ubigeoFromNominatim'

export const ubigeoService = {
  paises() {
    return apiGet<Pais[]>('/catalogos/ubigeo/paises')
  },

  departamentos(idPais: number) {
    return apiGet<Departamento[]>('/catalogos/ubigeo/departamentos', { params: { idPais } })
  },

  provincias(idDepartamento: number) {
    return apiGet<Provincia[]>('/catalogos/ubigeo/provincias', { params: { idDepartamento } })
  },

  distritos(idProvincia: number) {
    return apiGet<Distrito[]>('/catalogos/ubigeo/distritos', { params: { idProvincia } })
  },
}

export interface UbigeoMatchResult {
  idDepartamento?: number
  idProvincia?: number
  idDistrito?: number
}

function scoreMatch(nombreCatalogo: string, buscado: string): number {
  const a = normalizarUbigeoTexto(nombreCatalogo)
  const b = normalizarUbigeoTexto(buscado)
  if (!a || !b) return 0
  if (a === b) return 100
  if (a.includes(b) || b.includes(a)) return 80
  // tokens compartidos (carmen la legua reynoso vs carmen de la legua-reynoso)
  const tokensA = new Set(a.split(' ').filter((t) => t.length > 2))
  const tokensB = b.split(' ').filter((t) => t.length > 2)
  if (!tokensB.length) return 0
  const hits = tokensB.filter((t) => tokensA.has(t)).length
  const ratio = hits / tokensB.length
  if (ratio >= 0.8 && hits >= 2) return 70
  if (ratio >= 0.6 && hits >= 2) return 55
  return 0
}

function matchMejorPorNombres<T extends { id: number; nombre: string }>(
  items: T[],
  candidatos: Array<string | null | undefined>,
): T | undefined {
  let best: { item: T; score: number } | undefined
  for (const candidato of candidatos) {
    if (!candidato?.trim()) continue
    for (const item of items) {
      const score = scoreMatch(item.nombre, candidato)
      if (score <= 0) continue
      if (!best || score > best.score) best = { item, score }
    }
  }
  // Evitar matches flojos (ej. "Centro" → algo al azar)
  if (!best || best.score < 55) return undefined
  return best.item
}

export async function buscarIdsUbigeoPorNombre(params: {
  idPais: number
  departamento?: string | null
  provincia?: string | null
  provincias?: Array<string | null | undefined>
  distrito?: string | null
  distritos?: Array<string | null | undefined>
}): Promise<UbigeoMatchResult> {
  const resultado: UbigeoMatchResult = {}
  const provinciasCandidatas = [
    ...(params.provincias ?? []),
    params.provincia,
    // En Perú (Callao) la provincia puede llamarse igual que el departamento
    params.departamento,
  ]
  const distritosCandidatos = [...(params.distritos ?? []), params.distrito]

  if (!params.departamento) return resultado

  const departamentos = await ubigeoService.departamentos(params.idPais)
  const departamento = matchMejorPorNombres(departamentos, [params.departamento])
  if (!departamento) return resultado
  resultado.idDepartamento = departamento.id

  const provincias = await ubigeoService.provincias(departamento.id)
  const provincia = matchMejorPorNombres(provincias, provinciasCandidatas)
  if (!provincia) {
    // Si solo hay una provincia en el departamento, usarla
    if (provincias.length === 1) {
      resultado.idProvincia = provincias[0].id
    } else {
      return resultado
    }
  } else {
    resultado.idProvincia = provincia.id
  }

  const idProvincia = resultado.idProvincia
  if (!idProvincia) return resultado

  const distritos = await ubigeoService.distritos(idProvincia)
  const distrito = matchMejorPorNombres(distritos, distritosCandidatos)
  if (distrito) resultado.idDistrito = distrito.id

  return resultado
}
