import { apiGetPaginated } from '@/shared/api/apiClient'
import type {
  StockGas,
  StockGasListFilters,
} from '@/modules/balones/stock-gas/interfaces/stock-gas.interface'

export const stockGasService = {
  listar(filters: StockGasListFilters = {}) {
    return apiGetPaginated<StockGas>('/balones/stock-gas', { params: filters })
  },
}
