import { useQuery } from '@tanstack/vue-query'
import { computed, type Ref } from 'vue'
import { clientesQueryKeys } from '@/modules/clientes/constants/clientesQueryKeys'
import { clientesService } from '@/modules/clientes/services/clientes.service'

export function useClienteDetailQuery(id: Ref<number | undefined>, enabled: Ref<boolean>) {
  return useQuery({
    queryKey: computed(() => clientesQueryKeys.detail(id.value ?? 0)),
    queryFn: () => clientesService.obtenerPorId(id.value as number),
    enabled: computed(() => enabled.value && !!id.value),
    staleTime: 30 * 1000,
  })
}