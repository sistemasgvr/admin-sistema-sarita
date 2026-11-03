import { cargarCatalogoCompleto } from '@/shared/utils/cargarCatalogoCompleto'
import { apiGetPaginated } from '@/shared/api/apiClient'
import type {
  StockGas,
  StockGasListFilters,
} from '@/modules/balones/stock-gas/interfaces/stock-gas.interface'

export const stockGasService = {
  /** Todas las coincidencias para selectores; no confundir con el listado paginado. */
  listarCatalogo(filters: StockGasListFilters = {}, signal?: AbortSignal) {
    return cargarCatalogoCompleto(
      (pagina: StockGasListFilters) => apiGetPaginated<StockGas>('/balones/stock-gas', { params: pagina, signal }),
      filters,
      signal,
    )
  },

  listar(filters: StockGasListFilters = {}) {
    return apiGetPaginated<StockGas>('/balones/stock-gas', { params: filters })
  },
}
