import { keepPreviousData, useQuery } from '@tanstack/vue-query'
import { computed, type Ref } from 'vue'
import { condicionesPagoQueryKeys } from '@/modules/configuracion/condiciones-pago/constants/condicionesPagoQueryKeys'
import { condicionesPagoService } from '@/modules/configuracion/condiciones-pago/services/condiciones-pago.service'
import type { CondicionPagoListFilters } from '@/modules/configuracion/condiciones-pago/interfaces/condicion-pago.interface'

export function useCondicionesPagoQuery(filters: Ref<CondicionPagoListFilters>) {
  return useQuery({
    queryKey: computed(() => condicionesPagoQueryKeys.list(filters.value)),
    queryFn: () => condicionesPagoService.listar(filters.value),
    placeholderData: keepPreviousData,
  })
}
