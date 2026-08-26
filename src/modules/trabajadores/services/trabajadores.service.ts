import {
  apiDelete,
  apiGet,
  apiGetPaginated,
  apiPatch,
  apiPost,
} from '@/shared/api/apiClient'
import type {
  CreateTrabajadorPayload,
  DeleteTrabajadorResponse,
  Trabajador,
  TrabajadorListFilters,
  UpdateTrabajadorPayload,
} from '@/modules/trabajadores/interfaces/trabajador.interface'
import { usuariosService } from '@/modules/usuarios/services/usuarios.service'

export const trabajadoresService = {
  listar(filters: TrabajadorListFilters = {}) {
    return apiGetPaginated<Trabajador>('/trabajadores', { params: filters })
  },

  buscar(query: string, limite = 20) {
    return apiGetPaginated<Trabajador>('/trabajadores', {
      params: { buscar: query || undefined, pagina: 1, limite },
    })
  },

  obtenerPorId(id: number) {
    return apiGet<Trabajador>(`/trabajadores/${id}`)
  },

  crear(payload: CreateTrabajadorPayload) {
    return apiPost<Trabajador>('/trabajadores', payload)
  },

  actualizar(id: number, payload: UpdateTrabajadorPayload) {
    return apiPatch<Trabajador>(`/trabajadores/${id}`, payload)
  },

  eliminar(id: number, idUsuarioAuditoria: number) {
    return apiDelete<DeleteTrabajadorResponse>(`/trabajadores/${id}`, {
      data: { idUsuarioAuditoria },
    })
  },

  asignarUsuario(idTrabajador: number, idUsuario: number, idUsuarioAuditoria: number) {
    return usuariosService.actualizar(idUsuario, {
      idTrabajador: idTrabajador,
      idUsuarioAuditoria,
    })
  },
}
