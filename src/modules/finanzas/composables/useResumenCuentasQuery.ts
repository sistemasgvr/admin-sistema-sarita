import { computed, toValue, type MaybeRefOrGetter } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { finanzasQueryKeys } from '@/modules/finanzas/constants/finanzasQueryKeys'
import { finanzasService } from '@/modules/finanzas/services/finanzas.service'
import type { TipoCuenta } from '@/modules/finanzas/interfaces/cuenta.interface'

export function useResumenCuentasQuery(
  tipo: TipoCuenta,
  enabled: MaybeRefOrGetter<boolean> = true,
) {
  return useQuery({
    queryKey: finanzasQueryKeys.resumen(tipo),
    queryFn: () => finanzasService.resumen(tipo),
    staleTime: 60_000,
    enabled: computed(() => toValue(enabled)),
  })
}
