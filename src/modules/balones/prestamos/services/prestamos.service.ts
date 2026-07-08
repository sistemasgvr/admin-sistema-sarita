import { apiDelete, apiGet, apiGetPaginated, apiPatch, apiPost } from '@/shared/api/apiClient'
import type {
  CreatePrestamoPayload,
  DeletePrestamoResponse,
  Prestamo,
  PrestamoListFilters,
  UpdatePrestamoPayload,
} from '@/modules/balones/prestamos/interfaces/prestamo.interface'

export const prestamosService = {
  listar(filters: PrestamoListFilters = {}) {
    return apiGetPaginated<Prestamo>('/balones/prestamos', { params: filters })
  },

  obtenerPorId(id: number) {
    return apiGet<Prestamo>(`/balones/prestamos/${id}`)
  },

  crear(payload: CreatePrestamoPayload) {
    return apiPost<Prestamo>('/balones/prestamos', payload)
  },

  actualizar(id: number, payload: UpdatePrestamoPayload) {
    return apiPatch<Prestamo>(`/balones/prestamos/${id}`, payload)
  },

  eliminar(id: number, idUsuarioAuditoria: number) {
    return apiDelete<DeletePrestamoResponse>(`/balones/prestamos/${id}`, {
      data: { idUsuarioAuditoria },
    })
  },
}
