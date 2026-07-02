import { apiGet } from '@/shared/api/apiClient'
import type {
  Departamento,
  Distrito,
  Pais,
  Provincia,
} from '@/modules/catalogos/interfaces/ubigeo.interface'

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

const normalizar = (texto: string) => texto.trim().toLowerCase()


export async function buscarIdsUbigeoPorNombre(params: {
  idPais: number
  departamento?: string | null
  provincia?: string | null
  distrito?: string | null
}): Promise<UbigeoMatchResult> {
  const resultado: UbigeoMatchResult = {}

  if (!params.departamento) return resultado

  const departamentos = await ubigeoService.departamentos(params.idPais)
  const departamento = departamentos.find(
    (item) => normalizar(item.nombre) === normalizar(params.departamento as string),
  )
  if (!departamento) return resultado
  resultado.idDepartamento = departamento.id

  if (!params.provincia) return resultado

  const provincias = await ubigeoService.provincias(departamento.id)
  const provincia = provincias.find(
    (item) => normalizar(item.nombre) === normalizar(params.provincia as string),
  )
  if (!provincia) return resultado
  resultado.idProvincia = provincia.id

  if (!params.distrito) return resultado

  const distritos = await ubigeoService.distritos(provincia.id)
  const distrito = distritos.find(
    (item) => normalizar(item.nombre) === normalizar(params.distrito as string),
  )
  if (distrito) resultado.idDistrito = distrito.id

  return resultado
}
