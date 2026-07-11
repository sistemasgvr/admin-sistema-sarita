import {
  apiDelete,
  apiGet,
  apiGetPaginated,
  apiPatch,
  apiPost,
} from '@/shared/api/apiClient'
import type {
  CreateVehiculoPayload,
  DeleteVehiculoResponse,
  UpdateVehiculoPayload,
  Vehiculo,
  VehiculoListFilters,
} from '@/modules/vehiculos/interfaces/vehiculo.interface'

export const vehiculosService = {
  listar(filters: VehiculoListFilters = {}) {
    return apiGetPaginated<Vehiculo>('/vehiculos', { params: filters })
  },

  obtenerPorId(id: number) {
    return apiGet<Vehiculo>(`/vehiculos/${id}`)
  },

  crear(payload: CreateVehiculoPayload) {
    return apiPost<Vehiculo>('/vehiculos', payload)
  },

  actualizar(id: number, payload: UpdateVehiculoPayload) {
    return apiPatch<Vehiculo>(`/vehiculos/${id}`, payload)
  },

  eliminar(id: number, idUsuarioAuditoria: number) {
    return apiDelete<DeleteVehiculoResponse>(`/vehiculos/${id}`, {
      data: { idUsuarioAuditoria },
    })
  },
}
