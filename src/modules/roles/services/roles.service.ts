import {
  apiDelete,
  apiGet,
  apiGetPaginated,
  apiPatch,
  apiPost,
} from '@/shared/api/apiClient'
import type {
  AsignarRolPermisoPayload,
  CreateRolPayload,
  DeleteRolResponse,
  Rol,
  RolListFilters,
  RolPermisoAsignacion,
  RolPermisoListFilters,
  UpdateRolPayload,
} from '@/modules/roles/interfaces/rol.interface'

export const rolesService = {
  listar(filters: RolListFilters = {}) {
    return apiGetPaginated<Rol>('/auth/roles', { params: filters })
  },

  obtenerPorId(id: number) {
    return apiGet<Rol>(`/auth/roles/${id}`)
  },

  crear(payload: CreateRolPayload) {
    return apiPost<Rol>('/auth/roles', payload)
  },

  actualizar(id: number, payload: UpdateRolPayload) {
    return apiPatch<Rol>(`/auth/roles/${id}`, payload)
  },

  eliminar(id: number) {
    return apiDelete<DeleteRolResponse>(`/auth/roles/${id}`, { data: {} })
  },

  listarPermisosAsignados(filters: RolPermisoListFilters = {}) {
    return apiGetPaginated<RolPermisoAsignacion>('/auth/roles-permisos', {
      params: filters,
    })
  },

  asignarPermiso(payload: AsignarRolPermisoPayload) {
    return apiPost<RolPermisoAsignacion>('/auth/roles-permisos', payload)
  },

  quitarPermiso(asignacionId: number) {
    return apiDelete<{ eliminado: boolean; id: number }>(
      `/auth/roles-permisos/${asignacionId}`,
      { data: {} },
    )
  },
}
