import { cargarCatalogoCompleto } from '@/shared/utils/cargarCatalogoCompleto'
import {
  apiDelete,
  apiGet,
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
  /** Todas las coincidencias para selectores; no confundir con el listado paginado. */
  listarCatalogo(filters: StockListFilters = {}, signal?: AbortSignal) {
    return cargarCatalogoCompleto(
      (pagina: StockListFilters) => apiGetPaginated<Stock>('/productos/stock', { params: pagina, signal }),
      filters,
      signal,
    )
  },

  listar(filters: StockListFilters = {}) {
    return apiGetPaginated<Stock>('/productos/stock', { params: filters })
  },

  obtenerPorId(id: number) {
    return apiGet<Stock>(`/productos/stock/${id}`)
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

  restaurar(id: number, idUsuarioAuditoria?: number) {
    return apiPatch<DeleteStockResponse>(`/productos/stock/${id}/restaurar`, {
      idUsuarioAuditoria,
    })
  },
}
