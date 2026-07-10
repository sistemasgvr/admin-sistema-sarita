import { apiDelete, apiGet, apiGetPaginated, apiPatch, apiPost } from '@/shared/api/apiClient'
import type {
  CreateMovimientoRecargaPayload,
  CreateRecargaClientePayload,
  DeleteMovimientoRecargaResponse,
  MovimientoRecarga,
  MovimientoRecargaListFilters,
  RecargaClienteResult,
  UpdateMovimientoRecargaPayload,
} from '@/modules/balones/recargas/interfaces/movimiento-recarga.interface'

export const movimientosRecargaService = {
  listar(filters: MovimientoRecargaListFilters = {}) {
    return apiGetPaginated<MovimientoRecarga>('/balones/movimientos-recarga', { params: filters })
  },

  obtenerPorId(id: number) {
    return apiGet<MovimientoRecarga>(`/balones/movimientos-recarga/${id}`)
  },

  crear(payload: CreateMovimientoRecargaPayload) {
    return apiPost<MovimientoRecarga>('/balones/movimientos-recarga', payload)
  },

  crearRecargaCliente(payload: CreateRecargaClientePayload) {
    return apiPost<RecargaClienteResult>('/balones/movimientos-recarga/recarga-cliente', payload)
  },

  actualizar(id: number, payload: UpdateMovimientoRecargaPayload) {
    return apiPatch<MovimientoRecarga>(`/balones/movimientos-recarga/${id}`, payload)
  },

  eliminar(id: number, idUsuarioAuditoria: number) {
    return apiDelete<DeleteMovimientoRecargaResponse>(`/balones/movimientos-recarga/${id}`, {
      data: { idUsuarioAuditoria },
    })
  },
}
