import type { CondicionPagoListFilters } from '@/modules/configuracion/condiciones-pago/interfaces/condicion-pago.interface'

export const condicionesPagoQueryKeys = {
  all: ['condiciones-pago'] as const,
  lists: () => [...condicionesPagoQueryKeys.all, 'list'] as const,
  list: (filters: CondicionPagoListFilters) =>
    [...condicionesPagoQueryKeys.lists(), filters] as const,
  details: () => [...condicionesPagoQueryKeys.all, 'detail'] as const,
  detail: (id: number) => [...condicionesPagoQueryKeys.details(), id] as const,
}
