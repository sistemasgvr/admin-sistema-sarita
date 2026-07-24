import type { GarantiaListFilters } from '@/modules/balones/garantias/interfaces/garantia.interface'

export const garantiasQueryKeys = {
  all: ['garantias'] as const,
  lists: () => [...garantiasQueryKeys.all, 'list'] as const,
  list: (filters: GarantiaListFilters) => [...garantiasQueryKeys.lists(), filters] as const,
  details: () => [...garantiasQueryKeys.all, 'detail'] as const,
  detail: (id: number) => [...garantiasQueryKeys.details(), id] as const,
}
