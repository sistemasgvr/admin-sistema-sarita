import {
  apiDelete,
  apiGet,
  apiGetPaginated,
  apiPatch,
  apiPost,
} from '@/shared/api/apiClient'
import type {
  CreateTrabajadorPayload,
  DeleteTrabajadorResponse,
  Trabajador,
  TrabajadorListFilters,
  UpdateTrabajadorPayload,
} from '@/modules/trabajadores/interfaces/trabajador.interface'

export const trabajadoresService = {
  listar(filters: TrabajadorListFilters = {}) {
    return apiGetPaginated<Trabajador>('/trabajadores', { params: filters })
  },

  obtenerPorId(id: number) {
    return apiGet<Trabajador>(`/trabajadores/${id}`)
  },

  crear(payload: CreateTrabajadorPayload) {
    return apiPost<Trabajador>('/trabajadores', payload)
  },

  actualizar(id: number, payload: UpdateTrabajadorPayload) {
    return apiPatch<Trabajador>(`/trabajadores/${id}`, payload)
  },

  eliminar(id: number, idUsuarioAuditoria: number) {
    return apiDelete<DeleteTrabajadorResponse>(`/trabajadores/${id}`, {
      data: { idUsuarioAuditoria },
    })
  },
}
