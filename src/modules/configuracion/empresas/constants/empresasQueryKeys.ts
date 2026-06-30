import type { EmpresaListFilters } from '@/modules/configuracion/empresas/interfaces/empresa.interface'

export const empresasQueryKeys = {
  all: ['empresas'] as const,
  current: () => [...empresasQueryKeys.all, 'current'] as const,
  lists: () => [...empresasQueryKeys.all, 'list'] as const,
  list: (filters: EmpresaListFilters) => [...empresasQueryKeys.lists(), filters] as const,
  details: () => [...empresasQueryKeys.all, 'detail'] as const,
  detail: (id: number) => [...empresasQueryKeys.details(), id] as const,
}
