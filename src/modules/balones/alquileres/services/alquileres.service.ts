import { apiDelete, apiGet, apiGetPaginated, apiPatch, apiPost } from '@/shared/api/apiClient'
import type {
  Alquiler,
  AlquilerListFilters,
  CreateAlquilerPayload,
  DeleteAlquilerResponse,
  UpdateAlquilerPayload,
} from '@/modules/balones/alquileres/interfaces/alquiler.interface'

export const alquileresService = {
  listar(filters: AlquilerListFilters = {}) {
    return apiGetPaginated<Alquiler>('/balones/alquileres', { params: filters })
  },

  obtenerPorId(id: number) {
    return apiGet<Alquiler>(`/balones/alquileres/${id}`)
  },

  crear(payload: CreateAlquilerPayload) {
    return apiPost<Alquiler>('/balones/alquileres', payload)
  },

  actualizar(id: number, payload: UpdateAlquilerPayload) {
    return apiPatch<Alquiler>(`/balones/alquileres/${id}`, payload)
  },

  eliminar(id: number, idUsuarioAuditoria: number) {
    return apiDelete<DeleteAlquilerResponse>(`/balones/alquileres/${id}`, {
      data: { idUsuarioAuditoria },
    })
  },
}
