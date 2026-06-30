import type { PermisoListFilters } from '@/modules/permisos/interfaces/permiso.interface'

export const permisosQueryKeys = {
  all: ['permisos'] as const,
  lists: () => [...permisosQueryKeys.all, 'list'] as const,
  list: (filters: PermisoListFilters) => [...permisosQueryKeys.lists(), filters] as const,
  details: () => [...permisosQueryKeys.all, 'detail'] as const,
  detail: (id: number) => [...permisosQueryKeys.details(), id] as const,
}
