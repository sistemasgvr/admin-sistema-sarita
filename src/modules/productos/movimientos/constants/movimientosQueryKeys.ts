import type { MovimientoInventarioListFilters } from '@/modules/productos/movimientos/interfaces/movimiento-inventario.interface'

export const movimientosQueryKeys = {
  all: ['movimientos-inventario'] as const,
  lists: () => [...movimientosQueryKeys.all, 'list'] as const,
  list: (filters: MovimientoInventarioListFilters) =>
    [...movimientosQueryKeys.lists(), filters] as const,
}
