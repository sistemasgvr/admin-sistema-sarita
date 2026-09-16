import { apiGet, apiGetPaginated, apiPost, apiGetBlob } from '@/shared/api/apiClient'
import type {
  Percepcion,
  PercepcionListItem,
  CrearPercepcionPayload,
  EmitirPercepcionResponse,
} from '../interfaces/percepcion.interface'

export interface FiltrosPercepcion {
  idEmpresa?: number
  fechaDesde?: string
  fechaHasta?: string
  idCliente?: number
  pagina?: number
  tamano?: number
}

export const percepcionesService = {
  listar(filtros: FiltrosPercepcion) {
    return apiGetPaginated<PercepcionListItem>('/percepciones', { params: filtros })
  },

  obtenerPorId(id: number) {
    return apiGet<{ registro: Percepcion }>(`/percepciones/${id}`)
  },

  crear(payload: CrearPercepcionPayload) {
    return apiPost<{ id: number; serie: string; numero: string }>('/percepciones', payload)
  },

  emitir(id: number, idUsuarioAuditoria?: number) {
    return apiPost<EmitirPercepcionResponse>(`/percepciones/${id}/emitir`, { idUsuarioAuditoria })
  },

  descargarPdfXmlSunat(id: number) {
    return apiPost<{ pdfDescargado: boolean; xmlDescargado: boolean }>(
      `/percepciones/${id}/descargar-pdf-xml-sunat`,
      {},
    )
  },

  obtenerPdfOficial(id: number) {
    return apiGetBlob(`/percepciones/${id}/pdf-oficial`)
  },

  obtenerXmlOficial(id: number) {
    return apiGetBlob(`/percepciones/${id}/xml-oficial`)
  },
}
