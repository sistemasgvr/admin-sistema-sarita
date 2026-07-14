import { useQuery } from '@tanstack/vue-query'
import { computed, type Ref } from 'vue'
import { choferesQueryKeys } from '@/modules/choferes/constants/choferesQueryKeys'
import { choferesService } from '@/modules/choferes/services/choferes.service'

export function useChoferDetailQuery(id: Ref<number | undefined>, enabled: Ref<boolean>) {
  return useQuery({
    queryKey: computed(() => choferesQueryKeys.detail(id.value ?? 0)),
    queryFn: () => choferesService.obtenerPorId(id.value as number),
    enabled: computed(() => enabled.value && !!id.value),
    staleTime: 30 * 1000,
  })
}