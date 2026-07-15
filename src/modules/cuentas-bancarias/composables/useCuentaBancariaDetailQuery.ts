import { useQuery } from '@tanstack/vue-query'
import { computed, type Ref } from 'vue'
import { cuentasBancariasQueryKeys } from '@/modules/cuentas-bancarias/constants/cuentasBancariasQueryKeys'
import { cuentasBancariasService } from '@/modules/cuentas-bancarias/services/cuentas-bancarias.service'

export function useCuentaBancariaDetailQuery(id: Ref<number | undefined>, enabled: Ref<boolean>) {
  return useQuery({
    queryKey: computed(() => cuentasBancariasQueryKeys.detail(id.value ?? 0)),
    queryFn: () => cuentasBancariasService.obtenerPorId(id.value as number),
    enabled: computed(() => enabled.value && !!id.value),
    staleTime: 30 * 1000,
  })
}
