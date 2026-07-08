import type { MovimientoRecargaListFilters } from '@/modules/balones/recargas/interfaces/movimiento-recarga.interface'

export const movimientosRecargaQueryKeys = {
  all: ['movimientos-recarga'] as const,
  lists: () => [...movimientosRecargaQueryKeys.all, 'list'] as const,
  list: (filters: MovimientoRecargaListFilters) =>
    [...movimientosRecargaQueryKeys.lists(), filters] as const,
  details: () => [...movimientosRecargaQueryKeys.all, 'detail'] as const,
  detail: (id: number) => [...movimientosRecargaQueryKeys.details(), id] as const,
}
