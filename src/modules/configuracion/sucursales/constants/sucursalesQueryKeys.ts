import type { SucursalListFilters } from '@/modules/configuracion/sucursales/interfaces/sucursal.interface'

export const sucursalesQueryKeys = {
  all: ['sucursales'] as const,
  lists: () => [...sucursalesQueryKeys.all, 'list'] as const,
  list: (filters: SucursalListFilters) => [...sucursalesQueryKeys.lists(), filters] as const,
  details: () => [...sucursalesQueryKeys.all, 'detail'] as const,
  detail: (id: number) => [...sucursalesQueryKeys.details(), id] as const,
}
