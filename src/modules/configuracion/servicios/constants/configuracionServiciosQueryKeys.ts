import type { ConfiguracionServicioListFilters } from '@/modules/configuracion/servicios/interfaces/configuracion-servicio.interface'

export const configuracionServiciosQueryKeys = {
  all: ['configuracion-servicios'] as const,
  lists: () => [...configuracionServiciosQueryKeys.all, 'list'] as const,
  list: (filters: ConfiguracionServicioListFilters) =>
    [...configuracionServiciosQueryKeys.lists(), filters] as const,
  details: () => [...configuracionServiciosQueryKeys.all, 'detail'] as const,
  detail: (id: number) => [...configuracionServiciosQueryKeys.details(), id] as const,
}
