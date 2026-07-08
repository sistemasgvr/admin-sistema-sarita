import type { DireccionListFilters } from '@/modules/direcciones/interfaces/direccion.interface'

export const direccionesQueryKeys = {
  all: ['direcciones'] as const,
  lists: () => [...direccionesQueryKeys.all, 'list'] as const,
  list: (filters: DireccionListFilters) =>
    [...direccionesQueryKeys.lists(), filters] as const,
}
