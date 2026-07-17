import type { BajaClienteListFilters } from '@/modules/clientes/bajas-cliente/interfaces/baja-cliente.interface'

export const bajasClienteQueryKeys = {
  all: ['bajas-cliente'] as const,
  lists: () => [...bajasClienteQueryKeys.all, 'list'] as const,
  list: (filters: BajaClienteListFilters) =>
    [...bajasClienteQueryKeys.lists(), filters] as const,
  details: () => [...bajasClienteQueryKeys.all, 'detail'] as const,
  detail: (id: number) => [...bajasClienteQueryKeys.details(), id] as const,
}
