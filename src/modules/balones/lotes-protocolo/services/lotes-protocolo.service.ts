import { apiDelete, apiGet, apiGetPaginated, apiPatch, apiPost } from '@/shared/api/apiClient'
import type { PaginatedResult } from '@/shared/api/interfaces/api.interface'
import type {
  AplicarLoteProtocoloPayload,
  AplicarLoteProtocoloResult,
  CreateLoteProtocoloPayload,
  DeleteLoteProtocoloResponse,
  LoteProtocolo,
  LoteProtocoloHistorialItem,
  LoteProtocoloListFilters,
  UpdateLoteProtocoloPayload,
} from '@/modules/balones/lotes-protocolo/interfaces/lote-protocolo.interface'

export const lotesProtocoloService = {
  listar(filters: LoteProtocoloListFilters = {}) {
    return apiGetPaginated<LoteProtocolo>('/balones/lotes-protocolo', { params: filters })
  },

  obtenerPorId(id: number) {
    return apiGet<LoteProtocolo>(`/balones/lotes-protocolo/${id}`)
  },

  crear(payload: CreateLoteProtocoloPayload) {
    return apiPost<LoteProtocolo>('/balones/lotes-protocolo', payload)
  },

  actualizar(id: number, payload: UpdateLoteProtocoloPayload) {
    return apiPatch<LoteProtocolo>(`/balones/lotes-protocolo/${id}`, payload)
  },

  aplicarABalones(id: number, payload: AplicarLoteProtocoloPayload) {
    return apiPost<AplicarLoteProtocoloResult>(
      `/balones/lotes-protocolo/${id}/aplicar-balones`,
      payload,
    )
  },

  /** La ficha vigente del cilindro viaja en meta.resumen.vigente. */
  historialPorBalon(idBalon: number, params: { limite?: number; offset?: number } = {}) {
    return apiGetPaginated<LoteProtocoloHistorialItem>(
      `/balones/lotes-protocolo/balon/${idBalon}/historial`,
      { params },
    ) as Promise<PaginatedResult<LoteProtocoloHistorialItem[]>>
  },

  eliminar(id: number, idUsuarioAuditoria: number) {
    return apiDelete<DeleteLoteProtocoloResponse>(`/balones/lotes-protocolo/${id}`, {
      data: { idUsuarioAuditoria },
    })
  },
}
