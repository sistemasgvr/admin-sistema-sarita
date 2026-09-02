import type { InventarioMovimientoFilters } from '../interfaces/inventario-movimiento.interface'

export const inventarioMovimientosQueryKeys = {
  all: ['inventario-movimientos'] as const,
  lists: () => [...inventarioMovimientosQueryKeys.all, 'list'] as const,
  list: (filters: InventarioMovimientoFilters) => [...inventarioMovimientosQueryKeys.lists(), filters] as const,
  details: () => [...inventarioMovimientosQueryKeys.all, 'detail'] as const,
  detail: (id: number) => [...inventarioMovimientosQueryKeys.details(), id] as const,
}
