import { useQuery } from '@tanstack/vue-query'
import { finanzasQueryKeys } from '@/modules/finanzas/constants/finanzasQueryKeys'
import { finanzasService } from '@/modules/finanzas/services/finanzas.service'

export function useMediosPagoQuery() {
  return useQuery({
    queryKey: finanzasQueryKeys.mediosPago(),
    queryFn: () => finanzasService.mediosPago(),
    staleTime: 10 * 60 * 1000,
  })
}
