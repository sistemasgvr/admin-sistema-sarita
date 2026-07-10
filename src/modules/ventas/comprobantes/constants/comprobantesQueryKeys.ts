import type { ComprobanteListFilters } from '@/modules/ventas/comprobantes/interfaces/comprobante.interface'

export const comprobantesQueryKeys = {
  all: ['comprobantes'] as const,
  lists: () => [...comprobantesQueryKeys.all, 'list'] as const,
  list: (filters: ComprobanteListFilters) =>
    [...comprobantesQueryKeys.lists(), filters] as const,
  details: () => [...comprobantesQueryKeys.all, 'detail'] as const,
  detail: (id: number) => [...comprobantesQueryKeys.details(), id] as const,
  catalogosPos: () => [...comprobantesQueryKeys.all, 'catalogos-pos'] as const,
}
