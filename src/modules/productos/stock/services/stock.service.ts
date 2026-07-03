import {
  apiDelete,
  apiGetPaginated,
  apiPatch,
  apiPost,
} from '@/shared/api/apiClient'
import type {
  CreateStockPayload,
  DeleteStockResponse,
  Stock,
  StockListFilters,
  UpdateStockPayload,
} from '@/modules/productos/stock/interfaces/stock.interface'

export const stockService = {
  listar(filters: StockListFilters = {}) {
    return apiGetPaginated<Stock>('/productos/stock', { params: filters })
  },

  crear(payload: CreateStockPayload) {
    return apiPost<Stock>('/productos/stock', payload)
  },

  actualizar(id: number, payload: UpdateStockPayload) {
    return apiPatch<Stock>(`/productos/stock/${id}`, payload)
  },

  eliminar(id: number) {
    return apiDelete<DeleteStockResponse>(`/productos/stock/${id}`, { data: {} })
  },
}
