import { apiDelete, apiGet, apiGetPaginated, apiPatch, apiPost } from '@/shared/api/apiClient'
import type {
  CreateDocumentoVencimientoPayload,
  DeleteDocumentoVencimientoResponse,
  DocumentoVencimiento,
  DocumentoVencimientoListFilters,
  UpdateDocumentoVencimientoPayload,
} from '@/modules/documentos-vencimiento/interfaces/documento-vencimiento.interface'

export const documentosVencimientoService = {
  listar(filters: DocumentoVencimientoListFilters = {}) {
    return apiGetPaginated<DocumentoVencimiento>('/documentos-vencimiento', { params: filters })
  },

  obtenerPorId(id: number) {
    return apiGet<DocumentoVencimiento>(`/documentos-vencimiento/${id}`)
  },

  crear(payload: CreateDocumentoVencimientoPayload) {
    return apiPost<DocumentoVencimiento>('/documentos-vencimiento', payload)
  },

  actualizar(id: number, payload: UpdateDocumentoVencimientoPayload) {
    return apiPatch<DocumentoVencimiento>(`/documentos-vencimiento/${id}`, payload)
  },

  eliminar(id: number, idUsuarioAuditoria: number) {
    return apiDelete<DeleteDocumentoVencimientoResponse>(`/documentos-vencimiento/${id}`, {
      data: { idUsuarioAuditoria },
    })
  },
}
