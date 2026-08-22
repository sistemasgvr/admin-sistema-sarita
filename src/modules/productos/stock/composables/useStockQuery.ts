import { keepPreviousData, useQuery } from '@tanstack/vue-query'
import { computed, toValue, type MaybeRefOrGetter, type Ref } from 'vue'
import { stockQueryKeys } from '@/modules/productos/stock/constants/stockQueryKeys'
import { stockService } from '@/modules/productos/stock/services/stock.service'
import type { StockListFilters } from '@/modules/productos/stock/interfaces/stock.interface'

export function useStockQuery(
  filters: MaybeRefOrGetter<StockListFilters>,
  enabled: MaybeRefOrGetter<boolean> = true,
) {
  return useQuery({
    queryKey: computed(() => stockQueryKeys.list(toValue(filters))),
    queryFn: () => stockService.listar(toValue(filters)),
    enabled: computed(() => toValue(enabled)),
    placeholderData: keepPreviousData,
  })
}

export function useStockByIdQuery(id: Ref<number | null | undefined>, enabled = true) {
  return useQuery({
    queryKey: computed(() => stockQueryKeys.detail(Number(id.value ?? 0))),
    queryFn: () => stockService.obtenerPorId(Number(id.value)),
    enabled: computed(() => enabled && Number(id.value) > 0),
  })
}
