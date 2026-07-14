import { keepPreviousData, useQuery } from '@tanstack/vue-query'
import { computed, type Ref } from 'vue'
import { choferesQueryKeys } from '@/modules/choferes/constants/choferesQueryKeys'
import { choferesService } from '@/modules/choferes/services/choferes.service'
import type { ChoferListFilters } from '@/modules/choferes/interfaces/chofer.interface'

export function useChoferesQuery(filters: Ref<ChoferListFilters>, enabled?: Ref<boolean>) {
  return useQuery({
    queryKey: computed(() => choferesQueryKeys.list(filters.value)),
    queryFn: () => choferesService.listar(filters.value),
    placeholderData: keepPreviousData,
    enabled: enabled ?? computed(() => true),
  })
}
