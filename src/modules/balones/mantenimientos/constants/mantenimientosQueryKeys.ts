import type { MantenimientoListFilters } from '@/modules/balones/mantenimientos/interfaces/mantenimiento.interface'

export const mantenimientosQueryKeys = {
  all: ['mantenimientos'] as const,
  lists: () => [...mantenimientosQueryKeys.all, 'list'] as const,
  list: (filters: MantenimientoListFilters) =>
    [...mantenimientosQueryKeys.lists(), filters] as const,
  details: () => [...mantenimientosQueryKeys.all, 'detail'] as const,
  detail: (id: number) => [...mantenimientosQueryKeys.details(), id] as const,
}
