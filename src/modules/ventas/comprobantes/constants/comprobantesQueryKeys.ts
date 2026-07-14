import type { ComprobanteListFilters, ResumenDiarioListFilters } from '@/modules/ventas/comprobantes/interfaces/comprobante.interface'

export const comprobantesQueryKeys = {
  all: ['comprobantes'] as const,
  lists: () => [...comprobantesQueryKeys.all, 'list'] as const,
  list: (filters: ComprobanteListFilters) =>
    [...comprobantesQueryKeys.lists(), filters] as const,
  details: () => [...comprobantesQueryKeys.all, 'detail'] as const,
  detail: (id: number) => [...comprobantesQueryKeys.details(), id] as const,
  catalogosPos: () => [...comprobantesQueryKeys.all, 'catalogos-pos'] as const,
  resumenLists: () => [...comprobantesQueryKeys.all, 'resumen-list'] as const,
  resumenList: (filters: ResumenDiarioListFilters) =>
    [...comprobantesQueryKeys.resumenLists(), filters] as const,
  resumenDetail: (id: number) =>
    [...comprobantesQueryKeys.all, 'resumen-detail', id] as const,
  resumenPreview: (fecha: string) =>
    [...comprobantesQueryKeys.all, 'resumen-preview', fecha] as const,
}
