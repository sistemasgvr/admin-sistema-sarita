import { apiGet, apiGetPaginated, apiPost, apiGetBlob } from '@/shared/api/apiClient'
import type {
  Retencion,
  RetencionListItem,
  CrearRetencionPayload,
  EmitirRetencionResponse,
} from '../interfaces/retencion.interface'

export interface FiltrosRetencion {
  idEmpresa?: number
  fechaDesde?: string
  fechaHasta?: string
  idProveedor?: number
  pagina?: number
  tamano?: number
}

export const retencionesService = {
  listar(filtros: FiltrosRetencion) {
    return apiGetPaginated<RetencionListItem>('/retenciones', { params: filtros })
  },

  obtenerPorId(id: number) {
    return apiGet<{ registro: Retencion }>(`/retenciones/${id}`)
  },

  crear(payload: CrearRetencionPayload) {
    return apiPost<{ id: number; serie: string; numero: string }>('/retenciones', payload)
  },

  emitir(id: number, idUsuarioAuditoria?: number) {
    return apiPost<EmitirRetencionResponse>(`/retenciones/${id}/emitir`, { idUsuarioAuditoria })
  },

  descargarPdfXmlSunat(id: number) {
    return apiPost<{ pdfDescargado: boolean; xmlDescargado: boolean }>(
      `/retenciones/${id}/descargar-pdf-xml-sunat`,
      {},
    )
  },

  obtenerPdfOficial(id: number) {
    return apiGetBlob(`/retenciones/${id}/pdf-oficial`)
  },

  obtenerXmlOficial(id: number) {
    return apiGetBlob(`/retenciones/${id}/xml-oficial`)
  },
}
