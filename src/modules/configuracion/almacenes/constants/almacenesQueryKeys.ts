import type { AlmacenListFilters } from '@/modules/configuracion/almacenes/interfaces/almacen.interface'

export const almacenesQueryKeys = {
  all: ['almacenes'] as const,
  lists: () => [...almacenesQueryKeys.all, 'list'] as const,
  list: (filters: AlmacenListFilters) => [...almacenesQueryKeys.lists(), filters] as const,
  details: () => [...almacenesQueryKeys.all, 'detail'] as const,
  detail: (id: number) => [...almacenesQueryKeys.details(), id] as const,
}
