import { keepPreviousData, useQuery } from '@tanstack/vue-query'
import { computed, type Ref } from 'vue'
import { stockGasQueryKeys } from '@/modules/balones/stock-gas/constants/stockGasQueryKeys'
import { stockGasService } from '@/modules/balones/stock-gas/services/stock-gas.service'
import type { StockGasListFilters } from '@/modules/balones/stock-gas/interfaces/stock-gas.interface'

export function useStockGasQuery(filters: Ref<StockGasListFilters>) {
  return useQuery({
    queryKey: computed(() => stockGasQueryKeys.list(filters.value)),
    queryFn: () => stockGasService.listar(filters.value),
    placeholderData: keepPreviousData,
  })
}
