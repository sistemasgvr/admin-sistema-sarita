import { keepPreviousData, useQuery } from '@tanstack/vue-query'
import { computed, type Ref } from 'vue'
import { clientesQueryKeys } from '@/modules/clientes/constants/clientesQueryKeys'
import { clientesService } from '@/modules/clientes/services/clientes.service'
import type { ClienteMapaFilters } from '@/modules/clientes/interfaces/cliente.interface'

export function useClientesMapaQuery(filters: Ref<ClienteMapaFilters>) {
  return useQuery({
    queryKey: computed(() => clientesQueryKeys.mapa(filters.value)),
    queryFn: () => clientesService.listarMapa(filters.value),
    placeholderData: keepPreviousData,
  })
}
