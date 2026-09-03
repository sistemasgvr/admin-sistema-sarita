import type { DocumentoSalidaListFilters } from '@/modules/documentos-salida/interfaces/documento-salida.interface'

export const documentosSalidaQueryKeys = {
  all: ['documentos-salida'] as const,
  lists: () => [...documentosSalidaQueryKeys.all, 'list'] as const,
  list: (filters: DocumentoSalidaListFilters) =>
    [...documentosSalidaQueryKeys.lists(), filters] as const,
  details: () => [...documentosSalidaQueryKeys.all, 'detail'] as const,
  detail: (id: number) => [...documentosSalidaQueryKeys.details(), id] as const,
  catalogos: () => [...documentosSalidaQueryKeys.all, 'catalogos'] as const,
}
