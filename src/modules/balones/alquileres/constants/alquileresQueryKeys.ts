import type { AlquilerListFilters } from '@/modules/balones/alquileres/interfaces/alquiler.interface'

export const alquileresQueryKeys = {
  all: ['alquileres'] as const,
  lists: () => [...alquileresQueryKeys.all, 'list'] as const,
  list: (filters: AlquilerListFilters) => [...alquileresQueryKeys.lists(), filters] as const,
  details: () => [...alquileresQueryKeys.all, 'detail'] as const,
  detail: (id: number) => [...alquileresQueryKeys.details(), id] as const,
}
