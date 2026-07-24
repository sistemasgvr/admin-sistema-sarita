import type { ActividadListFilters } from '@/modules/operativa/actividades/interfaces/actividad.interface'

export const actividadesQueryKeys = {
  all: ['actividades'] as const,
  lists: () => [...actividadesQueryKeys.all, 'list'] as const,
  list: (filters: ActividadListFilters) =>
    [...actividadesQueryKeys.lists(), filters] as const,
  details: () => [...actividadesQueryKeys.all, 'detail'] as const,
  detail: (id: number) => [...actividadesQueryKeys.details(), id] as const,
}
