import type { LoteProtocoloListFilters } from '@/modules/balones/lotes-protocolo/interfaces/lote-protocolo.interface'

export const lotesProtocoloQueryKeys = {
  all: ['lotes-protocolo'] as const,
  lists: () => [...lotesProtocoloQueryKeys.all, 'list'] as const,
  list: (filters: LoteProtocoloListFilters) =>
    [...lotesProtocoloQueryKeys.lists(), filters] as const,
  details: () => [...lotesProtocoloQueryKeys.all, 'detail'] as const,
  detail: (id: number) => [...lotesProtocoloQueryKeys.details(), id] as const,
  historiales: () => [...lotesProtocoloQueryKeys.all, 'historial'] as const,
  historial: (idBalon: number) => [...lotesProtocoloQueryKeys.historiales(), idBalon] as const,
}
