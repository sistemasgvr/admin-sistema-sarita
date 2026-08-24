import type { ActivoListFilters } from '@/modules/activos/interfaces/activo.interface'

export const activosQueryKeys = {
  all: ['activos'] as const,
  lists: () => [...activosQueryKeys.all, 'list'] as const,
  list: (filters: ActivoListFilters) => [...activosQueryKeys.lists(), filters] as const,
  details: () => [...activosQueryKeys.all, 'detail'] as const,
  detail: (id: number) => [...activosQueryKeys.details(), id] as const,
}
