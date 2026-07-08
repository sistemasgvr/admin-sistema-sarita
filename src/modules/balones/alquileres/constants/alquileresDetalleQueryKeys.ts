import type { AlquilerDetalleListFilters } from '@/modules/balones/alquileres/interfaces/alquiler-detalle.interface'

export const alquileresDetalleQueryKeys = {
  all: ['alquileres-detalle'] as const,
  lists: () => [...alquileresDetalleQueryKeys.all, 'list'] as const,
  list: (filters: AlquilerDetalleListFilters) =>
    [...alquileresDetalleQueryKeys.lists(), filters] as const,
  details: () => [...alquileresDetalleQueryKeys.all, 'detail'] as const,
  detail: (id: number) => [...alquileresDetalleQueryKeys.details(), id] as const,
}
