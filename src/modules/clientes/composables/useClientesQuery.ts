import { keepPreviousData, useQuery } from '@tanstack/vue-query'
import { computed, type Ref } from 'vue'
import { clientesQueryKeys } from '@/modules/clientes/constants/clientesQueryKeys'
import { clientesService } from '@/modules/clientes/services/clientes.service'
import type { ClienteListFilters } from '@/modules/clientes/interfaces/cliente.interface'

export function useClientesQuery(filters: Ref<ClienteListFilters>) {
  return useQuery({
    queryKey: computed(() => clientesQueryKeys.list(filters.value)),
    queryFn: () => clientesService.listar(filters.value),
    placeholderData: keepPreviousData,
  })
}
