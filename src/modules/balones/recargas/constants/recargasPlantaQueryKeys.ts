import type { RecargaPlantaListFilters } from '@/modules/balones/recargas/interfaces/recarga-planta.interface'

export const recargasPlantaQueryKeys = {
  all: ['balones', 'recargas-planta'] as const,
  lists: () => [...recargasPlantaQueryKeys.all, 'list'] as const,
  list: (filters: RecargaPlantaListFilters) =>
    [...recargasPlantaQueryKeys.lists(), filters] as const,
  details: () => [...recargasPlantaQueryKeys.all, 'detail'] as const,
  detail: (id: number) => [...recargasPlantaQueryKeys.details(), id] as const,
}
