import { keepPreviousData, useQuery } from '@tanstack/vue-query'
import { computed, type Ref } from 'vue'
import { configuracionSunatQueryKeys } from '@/modules/configuracion/sunat/constants/configuracionSunatQueryKeys'
import { configuracionSunatService } from '@/modules/configuracion/sunat/services/configuracion-sunat.service'
import type { ConfiguracionSunatListFilters } from '@/modules/configuracion/sunat/interfaces/configuracion-sunat.interface'

export function useConfiguracionSunatQuery(filters: Ref<ConfiguracionSunatListFilters>) {
  return useQuery({
    queryKey: computed(() => configuracionSunatQueryKeys.list(filters.value)),
    queryFn: () => configuracionSunatService.listar(filters.value),
    placeholderData: keepPreviousData,
  })
}
