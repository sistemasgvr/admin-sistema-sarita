import type { BajaSolicitudListFilters } from '@/modules/balones/bajas-pendientes/interfaces/baja-solicitud.interface'

export const bajasPendientesQueryKeys = {
  all: ['bajas-pendientes'] as const,
  lists: () => [...bajasPendientesQueryKeys.all, 'list'] as const,
  list: (filters: BajaSolicitudListFilters) =>
    [...bajasPendientesQueryKeys.lists(), filters] as const,
}
