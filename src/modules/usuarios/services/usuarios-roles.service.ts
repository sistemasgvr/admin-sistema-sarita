import { apiDelete, apiGetPaginated, apiPost } from '@/shared/api/apiClient'
import type {
  AsignarUsuarioRolPayload,
  UsuarioRolAsignacion,
  UsuarioRolListFilters,
} from '@/modules/usuarios/interfaces/usuario.interface'

export const usuariosRolesService = {
  listar(filters: UsuarioRolListFilters = {}) {
    return apiGetPaginated<UsuarioRolAsignacion>('/auth/usuarios-roles', {
      params: filters,
    })
  },

  asignar(payload: AsignarUsuarioRolPayload) {
    return apiPost<UsuarioRolAsignacion>('/auth/usuarios-roles', payload)
  },

  quitar(asignacionId: number) {
    return apiDelete<{ eliminado: boolean; id: number }>(
      `/auth/usuarios-roles/${asignacionId}`,
      { data: {} },
    )
  },
}
