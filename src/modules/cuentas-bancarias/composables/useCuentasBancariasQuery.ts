import { keepPreviousData, useQuery } from '@tanstack/vue-query'
import { computed, type Ref } from 'vue'
import { cuentasBancariasQueryKeys } from '@/modules/cuentas-bancarias/constants/cuentasBancariasQueryKeys'
import { cuentasBancariasService } from '@/modules/cuentas-bancarias/services/cuentas-bancarias.service'
import type { CuentaBancariaListFilters } from '@/modules/cuentas-bancarias/interfaces/cuenta-bancaria.interface'

export function useCuentasBancariasQuery(filters: Ref<CuentaBancariaListFilters>, enabled?: Ref<boolean>) {
  return useQuery({
    queryKey: computed(() => cuentasBancariasQueryKeys.list(filters.value)),
    queryFn: () => cuentasBancariasService.listar(filters.value),
    placeholderData: keepPreviousData,
    enabled: enabled ?? computed(() => true),
  })
}
