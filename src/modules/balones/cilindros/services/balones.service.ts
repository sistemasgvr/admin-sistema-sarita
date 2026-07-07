import { apiDelete, apiGet, apiGetPaginated, apiPatch, apiPost } from '@/shared/api/apiClient'
import type {
  Balon,
  BalonListFilters,
  CreateBalonPayload,
  DeleteBalonResponse,
  UpdateBalonPayload,
} from '@/modules/balones/cilindros/interfaces/balon.interface'

export const balonesService = {
  listar(filters: BalonListFilters = {}) {
    return apiGetPaginated<Balon>('/balones', { params: filters })
  },

  obtenerPorId(id: number) {
    return apiGet<Balon>(`/balones/${id}`)
  },

  crear(payload: CreateBalonPayload) {
    return apiPost<Balon>('/balones', payload)
  },

  actualizar(id: number, payload: UpdateBalonPayload) {
    return apiPatch<Balon>(`/balones/${id}`, payload)
  },

  eliminar(id: number, idUsuarioAuditoria: number) {
    return apiDelete<DeleteBalonResponse>(`/balones/${id}`, {
      data: { idUsuarioAuditoria },
    })
  },
}
