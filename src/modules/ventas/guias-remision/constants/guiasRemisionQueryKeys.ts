import type { GuiaRemisionListFilters } from '@/modules/ventas/guias-remision/interfaces/guia-remision.interface'

export const guiasRemisionQueryKeys = {
  all: ['guias-remision'] as const,
  lists: () => [...guiasRemisionQueryKeys.all, 'list'] as const,
  list: (filters: GuiaRemisionListFilters) =>
    [...guiasRemisionQueryKeys.lists(), filters] as const,
  details: () => [...guiasRemisionQueryKeys.all, 'detail'] as const,
  detail: (id: number) => [...guiasRemisionQueryKeys.details(), id] as const,
  catalogos: () => [...guiasRemisionQueryKeys.all, 'catalogos'] as const,
}
