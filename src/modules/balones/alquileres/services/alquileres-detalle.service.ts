import { apiDelete, apiGet, apiGetPaginated, apiPatch, apiPost } from '@/shared/api/apiClient'
import type {
  AlquilerDetalle,
  AlquilerDetalleListFilters,
  CreateAlquilerDetallePayload,
  DeleteAlquilerDetalleResponse,
  DevolverAlquilerDetallePayload,
  UpdateAlquilerDetallePayload,
} from '@/modules/balones/alquileres/interfaces/alquiler-detalle.interface'

export const alquileresDetalleService = {
  listar(filters: AlquilerDetalleListFilters = {}) {
    return apiGetPaginated<AlquilerDetalle>('/balones/alquileres-detalle', { params: filters })
  },

  obtenerPorId(id: number) {
    return apiGet<AlquilerDetalle>(`/balones/alquileres-detalle/${id}`)
  },

  crear(payload: CreateAlquilerDetallePayload) {
    return apiPost<AlquilerDetalle>('/balones/alquileres-detalle', payload)
  },

  actualizar(id: number, payload: UpdateAlquilerDetallePayload) {
    return apiPatch<AlquilerDetalle>(`/balones/alquileres-detalle/${id}`, payload)
  },

  devolver(id: number, payload: DevolverAlquilerDetallePayload) {
    return apiPost<AlquilerDetalle>(`/balones/alquileres-detalle/${id}/devolver`, payload)
  },

  eliminar(id: number, idUsuarioAuditoria: number) {
    return apiDelete<DeleteAlquilerDetalleResponse>(`/balones/alquileres-detalle/${id}`, {
      data: { idUsuarioAuditoria },
    })
  },
}
