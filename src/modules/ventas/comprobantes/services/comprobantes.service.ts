import {
  apiDelete,
  apiGet,
  apiGetPaginated,
  apiPost,
} from '@/shared/api/apiClient'
import type {
  Comprobante,
  ComprobanteCatalogosPos,
  ComprobanteListFilters,
  ComprobanteListItem,
  CreateComprobantePayload,
  EmitirComprobanteResponse,
  SiguienteNumeroResponse,
} from '@/modules/ventas/comprobantes/interfaces/comprobante.interface'

export const comprobantesService = {
  listar(filters: ComprobanteListFilters) {
    return apiGetPaginated<ComprobanteListItem>('/comprobantes', { params: filters })
  },

  obtenerPorId(id: number) {
    return apiGet<Comprobante>(`/comprobantes/${id}`)
  },

  obtenerCatalogosPos() {
    return apiGet<ComprobanteCatalogosPos>('/comprobantes/catalogos/pos')
  },

  obtenerSiguienteNumero(idTipoComprobante: number, serie: string) {
    return apiGet<SiguienteNumeroResponse>('/comprobantes/siguiente-numero', {
      params: { idTipoComprobante, serie },
    })
  },

  crear(payload: CreateComprobantePayload) {
    return apiPost<Comprobante>('/comprobantes', payload)
  },

  emitir(id: number, idUsuarioAuditoria: number) {
    return apiPost<EmitirComprobanteResponse>(`/comprobantes/${id}/emitir`, {
      idUsuarioAuditoria,
    })
  },

  eliminar(id: number, idUsuarioAuditoria: number) {
    return apiDelete<{ eliminado: boolean; id: number }>(`/comprobantes/${id}`, {
      data: { idUsuarioAuditoria },
    })
  },
}
