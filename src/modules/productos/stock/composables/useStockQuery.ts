import { keepPreviousData, useQuery } from '@tanstack/vue-query'
import { computed, type Ref } from 'vue'
import { stockQueryKeys } from '@/modules/productos/stock/constants/stockQueryKeys'
import { stockService } from '@/modules/productos/stock/services/stock.service'
import type { StockListFilters } from '@/modules/productos/stock/interfaces/stock.interface'

export function useStockQuery(filters: Ref<StockListFilters>) {
  return useQuery({
    queryKey: computed(() => stockQueryKeys.list(filters.value)),
    queryFn: () => stockService.listar(filters.value),
    placeholderData: keepPreviousData,
  })
}
