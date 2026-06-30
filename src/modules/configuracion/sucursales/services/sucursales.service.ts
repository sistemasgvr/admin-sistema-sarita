import {
  apiDelete,
  apiGet,
  apiGetPaginated,
  apiPatch,
  apiPost,
} from '@/shared/api/apiClient'
import type {
  CreateSucursalPayload,
  DeleteSucursalResponse,
  Sucursal,
  SucursalListFilters,
  UpdateSucursalPayload,
} from '@/modules/configuracion/sucursales/interfaces/sucursal.interface'

export const sucursalesService = {
  listar(filters: SucursalListFilters = {}) {
    return apiGetPaginated<Sucursal>('/configuracion/sucursales', { params: filters })
  },

  obtenerPorId(id: number) {
    return apiGet<Sucursal>(`/configuracion/sucursales/${id}`)
  },

  crear(payload: CreateSucursalPayload) {
    return apiPost<Sucursal>('/configuracion/sucursales', payload)
  },

  actualizar(id: number, payload: UpdateSucursalPayload) {
    return apiPatch<Sucursal>(`/configuracion/sucursales/${id}`, payload)
  },

  eliminar(id: number) {
    return apiDelete<DeleteSucursalResponse>(`/configuracion/sucursales/${id}`, { data: {} })
  },
}
