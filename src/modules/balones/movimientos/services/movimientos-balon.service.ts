import { apiDelete, apiGet, apiGetPaginated, apiPatch, apiPost } from '@/shared/api/apiClient'
import type {
  CreateMovimientoBalonPayload,
  DeleteMovimientoBalonResponse,
  MovimientoBalon,
  MovimientoBalonListFilters,
  UpdateMovimientoBalonPayload,
} from '@/modules/balones/movimientos/interfaces/movimiento-balon.interface'

export const movimientosBalonService = {
  listar(filters: MovimientoBalonListFilters = {}) {
    return apiGetPaginated<MovimientoBalon>('/balones/movimientos', { params: filters })
  },

  obtenerPorId(id: number) {
    return apiGet<MovimientoBalon>(`/balones/movimientos/${id}`)
  },

  crear(payload: CreateMovimientoBalonPayload) {
    return apiPost<MovimientoBalon>('/balones/movimientos', payload)
  },

  actualizar(id: number, payload: UpdateMovimientoBalonPayload) {
    return apiPatch<MovimientoBalon>(`/balones/movimientos/${id}`, payload)
  },

  eliminar(id: number, idUsuarioAuditoria: number) {
    return apiDelete<DeleteMovimientoBalonResponse>(`/balones/movimientos/${id}`, {
      data: { idUsuarioAuditoria },
    })
  },
}
