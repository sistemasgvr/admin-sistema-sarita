import type {
  ActividadListFilters,
  OrigenVencidoRecojoFilters,
} from '@/modules/operativa/actividades/interfaces/actividad.interface'

export const actividadesQueryKeys = {
  all: ['actividades'] as const,
  lists: () => [...actividadesQueryKeys.all, 'list'] as const,
  list: (filters: ActividadListFilters) =>
    [...actividadesQueryKeys.lists(), filters] as const,
  proximas: (minutos = 60) =>
    [...actividadesQueryKeys.all, 'proximas', minutos] as const,
  vencidosRecojo: (filters: OrigenVencidoRecojoFilters = {}) =>
    [...actividadesQueryKeys.all, 'vencidos-recojo', filters] as const,
  details: () => [...actividadesQueryKeys.all, 'detail'] as const,
  detail: (id: number) => [...actividadesQueryKeys.details(), id] as const,
}
