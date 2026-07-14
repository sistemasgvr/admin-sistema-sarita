import type { ChoferListFilters } from '@/modules/choferes/interfaces/chofer.interface'

export const choferesQueryKeys = {
  all: ['choferes'] as const,
  lists: () => [...choferesQueryKeys.all, 'list'] as const,
  list: (filters: ChoferListFilters) =>
    [...choferesQueryKeys.lists(), filters] as const,
  details: () => [...choferesQueryKeys.all, 'detail'] as const,
  detail: (id: number) => [...choferesQueryKeys.details(), id] as const,
}