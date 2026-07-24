import type { CompraListFilters } from '@/modules/compras/interfaces/compra.interface'

export const comprasQueryKeys = {
  all: ['compras'] as const,
  lists: () => [...comprasQueryKeys.all, 'list'] as const,
  list: (filters: CompraListFilters) =>
    [...comprasQueryKeys.lists(), filters] as const,
  details: () => [...comprasQueryKeys.all, 'detail'] as const,
  detail: (id: number) => [...comprasQueryKeys.details(), id] as const,
}
