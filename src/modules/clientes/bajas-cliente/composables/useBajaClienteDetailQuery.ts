import { useQuery } from '@tanstack/vue-query'
import { computed, type Ref } from 'vue'
import { bajasClienteQueryKeys } from '@/modules/clientes/bajas-cliente/constants/bajasClienteQueryKeys'
import { bajasClienteService } from '@/modules/clientes/bajas-cliente/services/bajas-cliente.service'

export function useBajaClienteDetailQuery(id: Ref<number | undefined>, enabled: Ref<boolean>) {
  return useQuery({
    queryKey: computed(() => bajasClienteQueryKeys.detail(id.value ?? 0)),
    queryFn: () => bajasClienteService.obtenerPorId(id.value as number),
    enabled: computed(() => enabled.value && !!id.value),
    staleTime: 30 * 1000,
  })
}
