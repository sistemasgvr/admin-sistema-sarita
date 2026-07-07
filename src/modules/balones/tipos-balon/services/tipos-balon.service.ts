import {
  apiDelete,
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
