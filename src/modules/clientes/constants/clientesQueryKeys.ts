import type {
  ClienteListFilters,
  ClienteMapaFilters,
} from '@/modules/clientes/interfaces/cliente.interface'

export const clientesQueryKeys = {
  all: ['clientes'] as const,
  lists: () => [...clientesQueryKeys.all, 'list'] as const,
  list: (filters: ClienteListFilters) => [...clientesQueryKeys.lists(), filters] as const,
  mapa: (filters: ClienteMapaFilters) => [...clientesQueryKeys.all, 'mapa', filters] as const,
  details: () => [...clientesQueryKeys.all, 'detail'] as const,
  detail: (id: number) => [...clientesQueryKeys.details(), id] as const,
  validarDocumento: (numeroDocumento: string, idExcluir?: number) =>
    [...clientesQueryKeys.all, 'validar-documento', numeroDocumento, idExcluir] as const,
}
