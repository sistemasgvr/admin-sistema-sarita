import { apiDelete, apiGet, apiGetPaginated, apiPatch, apiPost } from '@/shared/api/apiClient'
import type {
  CreateMantenimientoPayload,
  DeleteMantenimientoResponse,
  FinalizarMantenimientoPayload,
  Mantenimiento,
  MantenimientoListFilters,
  UpdateMantenimientoPayload,
} from '@/modules/balones/mantenimientos/interfaces/mantenimiento.interface'

export const mantenimientosService = {
  listar(filters: MantenimientoListFilters = {}) {
    return apiGetPaginated<Mantenimiento>('/balones/mantenimientos', { params: filters })
  },

  obtenerPorId(id: number) {
    return apiGet<Mantenimiento>(`/balones/mantenimientos/${id}`)
  },

  crear(payload: CreateMantenimientoPayload) {
    return apiPost<Mantenimiento>('/balones/mantenimientos', payload)
  },

  actualizar(id: number, payload: UpdateMantenimientoPayload) {
    return apiPatch<Mantenimiento>(`/balones/mantenimientos/${id}`, payload)
  },

  finalizar(id: number, payload: FinalizarMantenimientoPayload) {
    return apiPost<Mantenimiento>(`/balones/mantenimientos/${id}/finalizar`, payload)
  },

  eliminar(id: number, idUsuarioAuditoria: number) {
    return apiDelete<DeleteMantenimientoResponse>(`/balones/mantenimientos/${id}`, {
      data: { idUsuarioAuditoria },
    })
  },
}
