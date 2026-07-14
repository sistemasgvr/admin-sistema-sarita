import type { MovimientoBalonListFilters } from '@/modules/balones/movimientos/interfaces/movimiento-balon.interface'

export const movimientosBalonQueryKeys = {
  all: ['movimientos-balon'] as const,
  lists: () => [...movimientosBalonQueryKeys.all, 'list'] as const,
  list: (filters: MovimientoBalonListFilters) =>
    [...movimientosBalonQueryKeys.lists(), filters] as const,
  details: () => [...movimientosBalonQueryKeys.all, 'detail'] as const,
  detail: (id: number) => [...movimientosBalonQueryKeys.details(), id] as const,
}
