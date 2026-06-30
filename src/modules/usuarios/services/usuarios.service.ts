import {
  apiDelete,
  apiGet,
  apiGetPaginated,
  apiPatch,
  apiPost,
} from '@/shared/api/apiClient'
import type {
  CreateUsuarioPayload,
  DeleteUsuarioResponse,
  UpdateUsuarioPayload,
  Usuario,
  UsuarioListFilters,
} from '@/modules/usuarios/interfaces/usuario.interface'

export const usuariosService = {
  listar(filters: UsuarioListFilters = {}) {
    return apiGetPaginated<Usuario>('/auth/usuarios', { params: filters })
  },

  obtenerPorId(id: number) {
    return apiGet<Usuario>(`/auth/usuarios/${id}`)
  },

  crear(payload: CreateUsuarioPayload) {
    return apiPost<Usuario>('/auth/usuarios', payload)
  },

  actualizar(id: number, payload: UpdateUsuarioPayload) {
    return apiPatch<Usuario>(`/auth/usuarios/${id}`, payload)
  },

  eliminar(id: number) {
    return apiDelete<DeleteUsuarioResponse>(`/auth/usuarios/${id}`)
  },
}
