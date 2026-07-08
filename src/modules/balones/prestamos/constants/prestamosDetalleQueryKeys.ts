import type { PrestamoDetalleListFilters } from '@/modules/balones/prestamos/interfaces/prestamo-detalle.interface'

export const prestamosDetalleQueryKeys = {
  all: ['prestamos-detalle'] as const,
  lists: () => [...prestamosDetalleQueryKeys.all, 'list'] as const,
  list: (filters: PrestamoDetalleListFilters) =>
    [...prestamosDetalleQueryKeys.lists(), filters] as const,
  details: () => [...prestamosDetalleQueryKeys.all, 'detail'] as const,
  detail: (id: number) => [...prestamosDetalleQueryKeys.details(), id] as const,
}
