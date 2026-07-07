import type { BalonListFilters } from '@/modules/balones/cilindros/interfaces/balon.interface'

export const balonesQueryKeys = {
  all: ['balones'] as const,
  lists: () => [...balonesQueryKeys.all, 'list'] as const,
  list: (filters: BalonListFilters) => [...balonesQueryKeys.lists(), filters] as const,
  details: () => [...balonesQueryKeys.all, 'detail'] as const,
  detail: (id: number) => [...balonesQueryKeys.details(), id] as const,
}
