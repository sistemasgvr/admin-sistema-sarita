import { useQuery } from '@tanstack/vue-query'
import { computed, type Ref } from 'vue'
import { direccionesQueryKeys } from '@/modules/direcciones/constants/direccionesQueryKeys'
import { direccionesService } from '@/modules/direcciones/services/direcciones.service'

export function useDireccionDetailQuery(id: Ref<number | undefined>, enabled: Ref<boolean>) {
  return useQuery({
    queryKey: computed(() => direccionesQueryKeys.detail(id.value ?? 0)),
    queryFn: () => direccionesService.obtenerPorId(id.value as number),
    enabled: computed(() => enabled.value && !!id.value),
    staleTime: 30 * 1000,
  })
}