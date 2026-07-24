import { apiDelete, apiGet, apiGetPaginated, apiPatch, apiPost } from '@/shared/api/apiClient'
import type {
  CreatePrestamoDetallePayload,
  DeletePrestamoDetalleResponse,
  DevolverPrestamoDetallePayload,
  PrestamoDetalle,
  PrestamoDetalleListFilters,
  UpdatePrestamoDetallePayload,
} from '@/modules/balones/prestamos/interfaces/prestamo-detalle.interface'

export const prestamosDetalleService = {
  listar(filters: PrestamoDetalleListFilters = {}) {
    return apiGetPaginated<PrestamoDetalle>('/balones/prestamos-detalle', { params: filters })
  },

  obtenerPorId(id: number) {
    return apiGet<PrestamoDetalle>(`/balones/prestamos-detalle/${id}`)
  },

  crear(payload: CreatePrestamoDetallePayload) {
    return apiPost<PrestamoDetalle>('/balones/prestamos-detalle', payload)
  },

  actualizar(id: number, payload: UpdatePrestamoDetallePayload) {
    return apiPatch<PrestamoDetalle>(`/balones/prestamos-detalle/${id}`, payload)
  },

  devolver(id: number, payload: DevolverPrestamoDetallePayload) {
    return apiPost<PrestamoDetalle>(`/balones/prestamos-detalle/${id}/devolver`, payload)
  },

  eliminar(id: number, idUsuarioAuditoria: number) {
    return apiDelete<DeletePrestamoDetalleResponse>(`/balones/prestamos-detalle/${id}`, {
      data: { idUsuarioAuditoria },
    })
  },
}
