import { keepPreviousData, useQuery } from '@tanstack/vue-query'
import { computed, type Ref } from 'vue'
import { tiposBalonQueryKeys } from '@/modules/balones/tipos-balon/constants/tiposBalonQueryKeys'
import { tiposBalonService } from '@/modules/balones/tipos-balon/services/tipos-balon.service'
import type { TipoBalonListFilters } from '@/modules/balones/tipos-balon/interfaces/tipo-balon.interface'

export function useTiposBalonQuery(filters: Ref<TipoBalonListFilters>) {
  return useQuery({
    queryKey: computed(() => tiposBalonQueryKeys.list(filters.value)),
    queryFn: () => tiposBalonService.listar(filters.value),
    placeholderData: keepPreviousData,
  })
}
