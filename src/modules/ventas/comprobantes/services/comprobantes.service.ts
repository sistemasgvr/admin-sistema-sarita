import {
  apiDelete,
  apiGet,
  apiGetBlob,
  apiGetPaginated,
  apiPatch,
  apiPost,
} from '@/shared/api/apiClient'
import type {
  NotaFiscalCorreccion,
  CambioBalonVsdPayload,
  OperacionesVsd,
  Comprobante,
  ComprobanteValidez,
  ComprobantePago,
  RegistrarCobroPayload,
  ComprobanteListFilters,
  ComprobanteListItem,
  ConsultarEstadoResumenResponse,
  ConvertirTipoComprobantePayload,
  ConvertirTipoComprobanteResponse,
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
  operacionesVsd(id: number) {
    return apiGet<OperacionesVsd>(`/comprobantes/${id}/operaciones-vsd`)
  },
  cambiarBalonVsd(id: number, payload: CambioBalonVsdPayload) {
    return apiPost<{ id: number; repetida: boolean }>(`/comprobantes/${id}/cambio-balon`, payload)
  },
  notasFiscalesCorreccion(id: number) {
    return apiGet<NotaFiscalCorreccion[]>(`/comprobantes/${id}/notas-fiscales`)
  },
  pdfNotaFiscalCorreccion(id: number, idNota: number) {
    return apiGetBlob(`/comprobantes/${id}/notas-fiscales/${idNota}/pdf`)
  },
  reintentarEnvio(id: number) {
    return apiPost<EmitirComprobanteResponse>(`/comprobantes/${id}/reintentar-envio`, {})
  },
  verificarEnvio(id: number) {
    return apiPost<{ estado: string; mensaje: string; verificadoEn: string }>(`/comprobantes/${id}/verificar-envio`, {})
  },
  sincronizarValidez(id: number) {
    return apiPost<ComprobanteValidez & { estadoActualizado: boolean }>(`/comprobantes/${id}/sincronizar-validez`, {})
  },
  regularizarCpe(id: number) {
    return apiPost<{ id: number; serie: string; numero: string; serie_anterior: string; numero_anterior: string }>(`/comprobantes/${id}/regularizar-cpe`, {})
  },
  consultarValidez(id: number) {
    return apiGet<ComprobanteValidez>(`/comprobantes/${id}/validez`)
  },
  obtenerXml(id: number) {
    return apiGetBlob(`/comprobantes/${id}/xml`)
  },

  listar(filters: ComprobanteListFilters) {
    return apiGetPaginated<ComprobanteListItem>('/comprobantes', { params: filters })
  },

  obtenerPorId(id: number) {
    return apiGet<Comprobante>(`/comprobantes/${id}`)
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

  /** Boleta ↔ factura en el mismo comprobante, con el siguiente correlativo de la serie destino. */
  convertirTipo(id: number, payload: ConvertirTipoComprobantePayload) {
    return apiPost<ConvertirTipoComprobanteResponse>(`/comprobantes/${id}/convertir-tipo`, payload)
  },

  /** Completa la referencia del cobro (voucher) de una venta ya emitida. */
  registrarCobro(id: number, payload: RegistrarCobroPayload) {
    return apiPatch<{ idComprobante: number; actualizados: number; pagos: ComprobantePago[] }>(
      `/comprobantes/${id}/cobro`,
      payload,
    )
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

  /**
   * Venta de mostrador: el cliente se lleva el cilindro y no hay orden de
   * salida que cierre la custodia. Pasa los balones que la venta dejó
   * reservados a "en poder del cliente".
   */
  confirmarEntregaMostrador(id: number) {
    return apiPost<{ id: number; balones_actualizados: number }>(
      `/comprobantes/${id}/entrega-mostrador`,
      {},
    )
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
