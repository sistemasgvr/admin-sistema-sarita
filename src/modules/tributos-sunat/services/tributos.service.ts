import { apiGet, apiGetBlob, apiGetPaginated, apiPost } from '@/shared/api/apiClient'
import type {
  CrearTributoPayload,
  EmitirTributoResponse,
  OrigenElegible,
  OrigenesElegiblesFilters,
  SeriesTributoResponse,
  TipoTributo,
  TributoCatalogos,
  TributoCreado,
  TributoListFilters,
  TributoListItem,
  TributoRegistro,
} from '../interfaces/tributo.interface'
import { TRIBUTOS_CONFIG } from '../config/tributos.config'

/** Mismo contrato para /percepciones y /retenciones; solo cambia la base. */
export function createTributoService(tipo: TipoTributo) {
  const { api } = TRIBUTOS_CONFIG[tipo]
  const elegibles = tipo === 'percepcion' ? 'comprobantes-elegibles' : 'compras-elegibles'
  return {
    listar(filters: TributoListFilters = {}) {
      return apiGetPaginated<TributoListItem>(api, { params: filters })
    },
    obtenerPorId(id: number) {
      return apiGet<TributoRegistro>(`${api}/${id}`)
    },
    obtenerCatalogos() {
      return apiGet<TributoCatalogos>(`${api}/catalogos`)
    },
    listarSeries(idEmpresa?: number) {
      return apiGet<SeriesTributoResponse>(`${api}/series`, { params: { idEmpresa } })
    },
    listarOrigenesElegibles(filters: OrigenesElegiblesFilters = {}) {
      return apiGet<OrigenElegible[]>(`${api}/${elegibles}`, { params: filters })
    },
    crear(payload: CrearTributoPayload) {
      return apiPost<TributoCreado>(api, payload)
    },
    emitir(id: number) {
      return apiPost<EmitirTributoResponse>(`${api}/${id}/emitir`, {})
    },
    obtenerPdfOficial(id: number) {
      return apiGetBlob(`${api}/${id}/pdf-oficial`)
    },
    obtenerXmlOficial(id: number) {
      return apiGetBlob(`${api}/${id}/xml-oficial`)
    },
  }
}

export type TributoService = ReturnType<typeof createTributoService>
