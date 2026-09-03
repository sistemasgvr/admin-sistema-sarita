import { apiGet, apiGetBlob, apiGetPaginated, apiPost, apiDelete } from '@/shared/api/apiClient'
import type {
  AnularDocumentoSalidaPayload,
  ConvertirGrePayload,
  CreateDocumentoSalidaDetallePayload,
  CreateDocumentoSalidaPayload,
  CrearDesdeVentaPayload,
  DocumentoSalida,
  DocumentoSalidaCatalogos,
  DocumentoSalidaListFilters,
  DocumentoSalidaListItem,
  EmitirDocumentoSalidaResponse,
  FinalizarRecargaPayload,
  GenerarRecojoDocSalidaPayload,
  RegistrarDireccionEntregaPayload,
  SiguienteNumeroDocumentoSalidaResponse,
} from '@/modules/documentos-salida/interfaces/documento-salida.interface'

export const documentosSalidaService = {
  listar(filters: DocumentoSalidaListFilters) {
    return apiGetPaginated<DocumentoSalidaListItem>('/documentos-salida', { params: filters })
  },

  obtenerPorId(id: number) {
    return apiGet<DocumentoSalida>(`/documentos-salida/${id}`)
  },

  obtenerCatalogos() {
    return apiGet<DocumentoSalidaCatalogos>('/documentos-salida/catalogos')
  },

  obtenerSiguienteNumero(idSucursal: number, fecha?: string) {
    return apiGet<SiguienteNumeroDocumentoSalidaResponse>('/documentos-salida/siguiente-numero', {
      params: { idSucursal, fecha },
    })
  },

  crear(payload: CreateDocumentoSalidaPayload) {
    return apiPost<DocumentoSalida>('/documentos-salida', payload)
  },

  crearDesdeVenta(payload: CrearDesdeVentaPayload) {
    return apiPost<DocumentoSalida>('/documentos-salida/crear-desde-venta', payload)
  },

  agregarDetalle(id: number, payload: CreateDocumentoSalidaDetallePayload) {
    return apiPost<DocumentoSalida>(`/documentos-salida/${id}/detalle`, payload)
  },

  eliminarDetalle(detalleId: number, idUsuarioAuditoria?: number) {
    return apiDelete<{ eliminado: boolean; id: number }>(
      `/documentos-salida/detalle/${detalleId}`,
      { data: { idUsuarioAuditoria } },
    )
  },

  generar(id: number, idUsuarioAuditoria?: number) {
    return apiPost<DocumentoSalida>(`/documentos-salida/${id}/generar`, { idUsuarioAuditoria })
  },

  convertirAGre(id: number, payload: ConvertirGrePayload) {
    return apiPost<DocumentoSalida>(`/documentos-salida/${id}/convertir-gre`, payload)
  },

  emitirSunat(id: number, idUsuarioAuditoria?: number) {
    return apiPost<EmitirDocumentoSalidaResponse>(`/documentos-salida/${id}/emitir-sunat`, {
      idUsuarioAuditoria,
    })
  },

  consultarEstado(id: number, idUsuarioAuditoria?: number) {
    return apiPost<EmitirDocumentoSalidaResponse>(`/documentos-salida/${id}/consultar-estado`, {
      idUsuarioAuditoria,
    })
  },

  registrarDireccionEntrega(id: number, payload: RegistrarDireccionEntregaPayload) {
    return apiPost<DocumentoSalida>(`/documentos-salida/${id}/direccion-entrega`, payload)
  },

  finalizarRecarga(id: number, payload: FinalizarRecargaPayload) {
    return apiPost<DocumentoSalida>(`/documentos-salida/${id}/finalizar-recarga`, payload)
  },

  generarRecojo(id: number, payload: GenerarRecojoDocSalidaPayload) {
    return apiPost<DocumentoSalida>(`/documentos-salida/${id}/recojo`, payload)
  },

  anular(id: number, payload: AnularDocumentoSalidaPayload) {
    return apiPost<DocumentoSalida>(`/documentos-salida/${id}/anular`, payload)
  },

  obtenerPdf(id: number) {
    return apiGetBlob(`/documentos-salida/${id}/pdf`)
  },
}
