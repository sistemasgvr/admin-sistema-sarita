import type { StockGasListFilters } from '@/modules/balones/stock-gas/interfaces/stock-gas.interface'

export const stockGasQueryKeys = {
  all: ['balones', 'stock-gas'] as const,
  lists: () => [...stockGasQueryKeys.all, 'list'] as const,
  list: (filters: StockGasListFilters) => [...stockGasQueryKeys.lists(), filters] as const,
}
