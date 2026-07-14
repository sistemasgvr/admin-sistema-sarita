import type { TipoBalonListFilters } from '@/modules/balones/tipos-balon/interfaces/tipo-balon.interface'

export const tiposBalonQueryKeys = {
  all: ['tipos-balon'] as const,
  lists: () => [...tiposBalonQueryKeys.all, 'list'] as const,
  list: (filters: TipoBalonListFilters) => [...tiposBalonQueryKeys.lists(), filters] as const,
  details: () => [...tiposBalonQueryKeys.all, 'detail'] as const,
  detail: (id: number) => [...tiposBalonQueryKeys.details(), id] as const,
}
