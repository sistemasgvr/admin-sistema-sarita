import {
  apiDelete,
  apiGet,
  apiGetPaginated,
  apiPatch,
  apiPost,
} from '@/shared/api/apiClient'
import type {
  Activo,
  ActivoListFilters,
  CreateActivoPayload,
  DeleteActivoResponse,
  UpdateActivoPayload,
} from '@/modules/activos/interfaces/activo.interface'

export const activosService = {
  listar(filters: ActivoListFilters = {}) {
    return apiGetPaginated<Activo>('/activos', { params: filters })
  },

  obtenerPorId(id: number) {
    return apiGet<Activo>(`/activos/${id}`)
  },

  crear(payload: CreateActivoPayload) {
    return apiPost<Activo>('/activos', payload)
  },

  actualizar(id: number, payload: UpdateActivoPayload) {
    return apiPatch<Activo>(`/activos/${id}`, payload)
  },

  eliminar(id: number, idUsuarioAuditoria: number) {
    return apiDelete<DeleteActivoResponse>(`/activos/${id}`, {
      data: { idUsuarioAuditoria },
    })
  },
}
