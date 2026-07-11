import {
  apiDelete,
  apiGet,
  apiGetPaginated,
  apiPatch,
  apiPost,
} from '@/shared/api/apiClient'
import type {
  Chofer,
  ChoferListFilters,
  CreateChoferPayload,
  DeleteChoferResponse,
  UpdateChoferPayload,
} from '@/modules/choferes/interfaces/chofer.interface'

export const choferesService = {
  listar(filters: ChoferListFilters = {}) {
    return apiGetPaginated<Chofer>('/choferes', { params: filters })
  },

  obtenerPorId(id: number) {
    return apiGet<Chofer>(`/choferes/${id}`)
  },

  crear(payload: CreateChoferPayload) {
    return apiPost<Chofer>('/choferes', payload)
  },

  actualizar(id: number, payload: UpdateChoferPayload) {
    return apiPatch<Chofer>(`/choferes/${id}`, payload)
  },

  eliminar(id: number, idUsuarioAuditoria: number) {
    return apiDelete<DeleteChoferResponse>(`/choferes/${id}`, {
      data: { idUsuarioAuditoria },
    })
  },
}
