import { keepPreviousData, useQuery } from '@tanstack/vue-query'
import { computed, type Ref } from 'vue'
import { finanzasQueryKeys } from '@/modules/finanzas/constants/finanzasQueryKeys'
import { finanzasService } from '@/modules/finanzas/services/finanzas.service'
import type {
  SaldoPorTerceroFilters,
  TipoCuenta,
} from '@/modules/finanzas/interfaces/cuenta.interface'

export function useSaldosPorTerceroQuery(
  tipo: TipoCuenta,
  filters: Ref<SaldoPorTerceroFilters>,
  enabled: Ref<boolean>,
) {
  return useQuery({
    queryKey: computed(() => finanzasQueryKeys.saldosList(tipo, filters.value)),
    queryFn: () => finanzasService.listarSaldosPorTercero(tipo, filters.value),
    enabled: computed(() => enabled.value),
    placeholderData: keepPreviousData,
  })
}
