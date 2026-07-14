import {
  apiDelete,
  apiGet,
  apiGetPaginated,
  apiPatch,
  apiPost,
} from '@/shared/api/apiClient'
import type {
  CreateTipoBalonPayload,
  DeleteTipoBalonResponse,
  TipoBalon,
  TipoBalonListFilters,
  UpdateTipoBalonPayload,
} from '@/modules/balones/tipos-balon/interfaces/tipo-balon.interface'

export const tiposBalonService = {
  listar(filters: TipoBalonListFilters = {}) {
    return apiGetPaginated<TipoBalon>('/balones/tipos', { params: filters })
  },

  obtenerPorId(id: number) {
    return apiGet<TipoBalon>(`/balones/tipos/${id}`)
  },

  crear(payload: CreateTipoBalonPayload) {
    return apiPost<TipoBalon>('/balones/tipos', payload)
  },

  actualizar(id: number, payload: UpdateTipoBalonPayload) {
    return apiPatch<TipoBalon>(`/balones/tipos/${id}`, payload)
  },

  eliminar(id: number, idUsuarioAuditoria: number) {
    return apiDelete<DeleteTipoBalonResponse>(`/balones/tipos/${id}`, {
      data: { idUsuarioAuditoria },
    })
  },
}
