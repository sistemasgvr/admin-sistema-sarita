import type { DocumentoVencimientoListFilters } from '@/modules/documentos-vencimiento/interfaces/documento-vencimiento.interface'

export const documentosVencimientoQueryKeys = {
  all: ['documentos-vencimiento'] as const,
  lists: () => [...documentosVencimientoQueryKeys.all, 'list'] as const,
  list: (filters: DocumentoVencimientoListFilters) =>
    [...documentosVencimientoQueryKeys.lists(), filters] as const,
  details: () => [...documentosVencimientoQueryKeys.all, 'detail'] as const,
  detail: (id: number) => [...documentosVencimientoQueryKeys.details(), id] as const,
}
