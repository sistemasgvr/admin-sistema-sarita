import {
  apiDelete,
  apiGet,
  apiGetPaginated,
  apiPatch,
  apiPost,
} from '@/shared/api/apiClient'
import type {
  CreatePermisoPayload,
  DeletePermisoResponse,
  Permiso,
  PermisoListFilters,
  UpdatePermisoPayload,
} from '@/modules/permisos/interfaces/permiso.interface'

export const permisosService = {
  listar(filters: PermisoListFilters = {}) {
    return apiGetPaginated<Permiso>('/auth/permisos', { params: filters })
  },

  obtenerPorId(id: number) {
    return apiGet<Permiso>(`/auth/permisos/${id}`)
  },

  crear(payload: CreatePermisoPayload) {
    return apiPost<Permiso>('/auth/permisos', payload)
  },

  actualizar(id: number, payload: UpdatePermisoPayload) {
    return apiPatch<Permiso>(`/auth/permisos/${id}`, payload)
  },

  eliminar(id: number) {
    return apiDelete<DeletePermisoResponse>(`/auth/permisos/${id}`, { data: {} })
  },
}
