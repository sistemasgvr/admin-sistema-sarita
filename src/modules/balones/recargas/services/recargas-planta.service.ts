import { apiDelete, apiGet, apiGetPaginated, apiPatch, apiPost } from '@/shared/api/apiClient'
import type {
  CreateRecargaPlantaPayload,
  RecargaPlanta,
  RecargaPlantaListFilters,
  RecargaPlantaProtocoloFila,
  UpdateRecargaPlantaPayload,
} from '@/modules/balones/recargas/interfaces/recarga-planta.interface'

export const recargasPlantaService = {
  listar(filters: RecargaPlantaListFilters = {}) {
    return apiGetPaginated<RecargaPlanta>('/balones/recargas-planta', { params: filters })
  },

  listarProtocolo(filters: RecargaPlantaListFilters = {}) {
    return apiGet<RecargaPlantaProtocoloFila[]>('/balones/recargas-planta/protocolo', {
      params: {
        buscar: filters.buscar,
        idProveedor: filters.idProveedor,
        idAlmacen: filters.idAlmacen,
        idEstado: filters.idEstado,
        fechaDesde: filters.fechaDesde,
        fechaHasta: filters.fechaHasta,
      },
    })
  },

  obtenerPorId(id: number) {
    return apiGet<RecargaPlanta>(`/balones/recargas-planta/${id}`)
  },

  crear(payload: CreateRecargaPlantaPayload) {
    return apiPost<RecargaPlanta>('/balones/recargas-planta', payload)
  },

  actualizar(id: number, payload: UpdateRecargaPlantaPayload) {
    return apiPatch<RecargaPlanta>(`/balones/recargas-planta/${id}`, payload)
  },

  eliminar(id: number, idUsuarioAuditoria: number) {
    return apiDelete<{ eliminado: boolean; id: number }>(`/balones/recargas-planta/${id}`, {
      data: { idUsuarioAuditoria },
    })
  },
}
