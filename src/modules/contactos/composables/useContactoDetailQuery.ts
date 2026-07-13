import { useQuery } from '@tanstack/vue-query'
import { computed, type Ref } from 'vue'
import { contactosQueryKeys } from '@/modules/contactos/constants/contactosQueryKeys'
import { contactosService } from '@/modules/contactos/services/contactos.service'

export function useContactoDetailQuery(id: Ref<number | undefined>, enabled: Ref<boolean>) {
  return useQuery({
    queryKey: computed(() => contactosQueryKeys.detail(id.value ?? 0)),
    queryFn: () => contactosService.obtenerPorId(id.value as number),
    enabled: computed(() => enabled.value && !!id.value),
    staleTime: 30 * 1000,
  })
}