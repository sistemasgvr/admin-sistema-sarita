import type { StockListFilters } from '@/modules/productos/stock/interfaces/stock.interface'

export const stockQueryKeys = {
  all: ['stock'] as const,
  lists: () => [...stockQueryKeys.all, 'list'] as const,
  list: (filters: StockListFilters) => [...stockQueryKeys.lists(), filters] as const,
}
