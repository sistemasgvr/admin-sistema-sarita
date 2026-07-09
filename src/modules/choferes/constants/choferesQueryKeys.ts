import type { ChoferListFilters } from '@/modules/choferes/interfaces/chofer.interface'

export const choferesQueryKeys = {
  all: ['choferes'] as const,
  lists: () => [...choferesQueryKeys.all, 'list'] as const,
  list: (filters: ChoferListFilters) =>
    [...choferesQueryKeys.lists(), filters] as const,
}
