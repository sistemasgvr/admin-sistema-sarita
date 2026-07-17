import { useQuery } from '@tanstack/vue-query'
import { computed, type Ref } from 'vue'
import { bajasClienteQueryKeys } from '@/modules/clientes/bajas-cliente/constants/bajasClienteQueryKeys'
import type { BajaClienteListFilters } from '@/modules/clientes/bajas-cliente/interfaces/baja-cliente.interface'
import { bajasClienteService } from '@/modules/clientes/bajas-cliente/services/bajas-cliente.service'

export function useBajasClienteQuery(
  filters: Ref<BajaClienteListFilters>,
  options: { enabled?: Ref<boolean> | boolean } = {},
) {
  const enabled = computed(() => {
    const value = options.enabled
    if (value == null) return true
    return typeof value === 'boolean' ? value : value.value
  })

  return useQuery({
    queryKey: computed(() => bajasClienteQueryKeys.list(filters.value)),
    queryFn: () => bajasClienteService.listar(filters.value),
    enabled,
  })
}
