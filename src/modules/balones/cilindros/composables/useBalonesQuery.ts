import { keepPreviousData, useQuery } from '@tanstack/vue-query'
import { computed, type Ref } from 'vue'
import { balonesQueryKeys } from '@/modules/balones/cilindros/constants/balonesQueryKeys'
import { balonesService } from '@/modules/balones/cilindros/services/balones.service'
import type { BalonListFilters } from '@/modules/balones/cilindros/interfaces/balon.interface'

export function useBalonesQuery(filters: Ref<BalonListFilters>) {
  return useQuery({
    queryKey: computed(() => balonesQueryKeys.list(filters.value)),
    queryFn: () => balonesService.listar(filters.value),
    placeholderData: keepPreviousData,
  })
}

export function useBalonQuery(id: Ref<number | null | undefined>) {
  return useQuery({
    queryKey: computed(() => balonesQueryKeys.detail(id.value ?? 0)),
    queryFn: () => balonesService.obtenerPorId(id.value!),
    enabled: computed(() => id.value != null && id.value > 0),
  })
}
