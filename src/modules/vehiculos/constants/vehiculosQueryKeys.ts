import type { VehiculoListFilters } from '@/modules/vehiculos/interfaces/vehiculo.interface'

export const vehiculosQueryKeys = {
  all: ['vehiculos'] as const,
  lists: () => [...vehiculosQueryKeys.all, 'list'] as const,
  list: (filters: VehiculoListFilters) =>
    [...vehiculosQueryKeys.lists(), filters] as const,
  details: () => [...vehiculosQueryKeys.all, 'detail'] as const,
  detail: (id: number) => [...vehiculosQueryKeys.details(), id] as const,
}