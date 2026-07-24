import { apiGet, apiGetPaginated, apiPost } from '@/shared/api/apiClient'
import type {
  CreateGarantiaPayload,
  DevolverGarantiaPayload,
  Garantia,
  GarantiaListFilters,
} from '@/modules/balones/garantias/interfaces/garantia.interface'

export const garantiasService = {
  listar(filters: GarantiaListFilters = {}) {
    return apiGetPaginated<Garantia>('/garantias', { params: filters })
  },

  obtenerPorId(id: number) {
    return apiGet<Garantia>(`/garantias/${id}`)
  },

  crear(payload: CreateGarantiaPayload) {
    return apiPost<Garantia>('/garantias', payload)
  },

  devolver(id: number, payload: DevolverGarantiaPayload) {
    return apiPost<Garantia>(`/garantias/${id}/devolver`, payload)
  },
}
