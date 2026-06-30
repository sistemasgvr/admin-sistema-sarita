import { keepPreviousData, useQuery } from '@tanstack/vue-query'
import { computed, type Ref } from 'vue'
import { configuracionServiciosQueryKeys } from '@/modules/configuracion/servicios/constants/configuracionServiciosQueryKeys'
import { configuracionServiciosService } from '@/modules/configuracion/servicios/services/configuracion-servicios.service'
import type { ConfiguracionServicioListFilters } from '@/modules/configuracion/servicios/interfaces/configuracion-servicio.interface'

export function useConfiguracionServiciosQuery(filters: Ref<ConfiguracionServicioListFilters>) {
  return useQuery({
    queryKey: computed(() => configuracionServiciosQueryKeys.list(filters.value)),
    queryFn: () => configuracionServiciosService.listar(filters.value),
    placeholderData: keepPreviousData,
  })
}
