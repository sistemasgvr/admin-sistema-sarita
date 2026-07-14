import {
  apiDelete,
  apiGet,
  apiGetBlob,
  apiGetPaginated,
  apiPatch,
  apiPost,
} from '@/shared/api/apiClient'
import type {
  Comprobante,
  ComprobanteCatalogosPos,
  ComprobanteListFilters,
  ComprobanteListItem,
  ConsultarEstadoResumenResponse,
  CreateComprobantePayload,
  EmitirComprobanteResponse,
  EnviarResumenDiarioPayload,
  EnviarResumenDiarioResponse,
  ResumenDiario,
  ResumenDiarioListFilters,
  ResumenDiarioListItem,
  ResumenDiarioPreview,
  SiguienteCorrelativoResumenResponse,
  SiguienteNumeroResponse,
  UpdateComprobantePayload,
} from '@/modules/ventas/comprobantes/interfaces/comprobante.interface'
import type { ComprobantePdfFormato } from '@/modules/ventas/comprobantes/utils/comprobantePdf'

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

  actualizar(id: number, payload: UpdateComprobantePayload) {
    return apiPatch<Comprobante>(`/comprobantes/${id}`, payload)
  },

  emitir(id: number, idUsuarioAuditoria: number) {
    return apiPost<EmitirComprobanteResponse>(`/comprobantes/${id}/emitir`, {
      idUsuarioAuditoria,
    })
  },

  consultarCdr(id: number, idUsuarioAuditoria: number) {
    return apiPost<EmitirComprobanteResponse>(`/comprobantes/${id}/consultar-cdr`, {
      idUsuarioAuditoria,
    })
  },

  anular(id: number, idUsuarioAuditoria: number, motivo: string) {
    return apiPost<EmitirComprobanteResponse>(`/comprobantes/${id}/anular`, {
      idUsuarioAuditoria,
      motivo,
    })
  },

  listarResumenDiario(filters: ResumenDiarioListFilters) {
    return apiGetPaginated<ResumenDiarioListItem>('/comprobantes/resumenes', {
      params: filters,
    })
  },

  obtenerResumenDiario(id: number) {
    return apiGet<ResumenDiario>(`/comprobantes/resumenes/${id}`)
  },

  siguienteCorrelativoResumen(fecha: string) {
    return apiGet<SiguienteCorrelativoResumenResponse>(
      '/comprobantes/resumenes/siguiente-correlativo',
      { params: { fecha } },
    )
  },

  previewResumenDiario(fecha: string) {
    return apiGet<ResumenDiarioPreview>('/comprobantes/resumenes/preview', {
      params: { fecha },
    })
  },

  enviarResumenDiario(payload: EnviarResumenDiarioPayload) {
    return apiPost<EnviarResumenDiarioResponse>('/comprobantes/resumenes/enviar', payload)
  },

  consultarEstadoResumen(id: number, idUsuarioAuditoria: number) {
    return apiPost<ConsultarEstadoResumenResponse>(
      `/comprobantes/resumenes/${id}/consultar-estado`,
      { idUsuarioAuditoria },
    )
  },

  obtenerPdf(id: number, formato: ComprobantePdfFormato = 'a4') {
    return apiGetBlob(`/comprobantes/${id}/pdf`, {
      params: { formato },
    })
  },

  eliminar(id: number, idUsuarioAuditoria: number) {
    return apiDelete<{ eliminado: boolean; id: number }>(`/comprobantes/${id}`, {
      data: { idUsuarioAuditoria },
    })
  },
}
