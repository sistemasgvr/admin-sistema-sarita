import type { ConfiguracionSunatListFilters } from '@/modules/configuracion/sunat/interfaces/configuracion-sunat.interface'

export const configuracionSunatQueryKeys = {
  all: ['configuracion-sunat'] as const,
  current: () => [...configuracionSunatQueryKeys.all, 'current'] as const,
  lists: () => [...configuracionSunatQueryKeys.all, 'list'] as const,
  list: (filters: ConfiguracionSunatListFilters) =>
    [...configuracionSunatQueryKeys.lists(), filters] as const,
  details: () => [...configuracionSunatQueryKeys.all, 'detail'] as const,
  detail: (id: number) => [...configuracionSunatQueryKeys.details(), id] as const,
}
