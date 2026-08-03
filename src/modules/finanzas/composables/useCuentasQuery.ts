import { keepPreviousData, useQuery } from '@tanstack/vue-query'
import { computed, type Ref } from 'vue'
import { finanzasQueryKeys } from '@/modules/finanzas/constants/finanzasQueryKeys'
import { finanzasService } from '@/modules/finanzas/services/finanzas.service'
import type { CuentaListFilters, TipoCuenta } from '@/modules/finanzas/interfaces/cuenta.interface'

export function useCuentasQuery(tipo: TipoCuenta, filters: Ref<CuentaListFilters>) {
  return useQuery({
    queryKey: computed(() => finanzasQueryKeys.cuentasList(tipo, filters.value)),
    queryFn: () => finanzasService.listarCuentas(tipo, filters.value),
    placeholderData: keepPreviousData,
  })
}
