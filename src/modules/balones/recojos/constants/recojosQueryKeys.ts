import type {
  PendienteRecojoFilters,
  RecojoListFilters,
} from '@/modules/balones/recojos/interfaces/recojo.interface'

export const recojosQueryKeys = {
  all: ['recojos-balon'] as const,
  lists: () => [...recojosQueryKeys.all, 'list'] as const,
  list: (filters: RecojoListFilters) => [...recojosQueryKeys.lists(), filters] as const,
  pendientes: (filters: PendienteRecojoFilters) =>
    [...recojosQueryKeys.all, 'pendientes', filters] as const,
  details: () => [...recojosQueryKeys.all, 'detail'] as const,
  detail: (id: number) => [...recojosQueryKeys.details(), id] as const,
}
