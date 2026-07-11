import { keepPreviousData, useQuery } from '@tanstack/vue-query'
import { computed, type Ref } from 'vue'
import { contactosQueryKeys } from '@/modules/contactos/constants/contactosQueryKeys'
import { contactosService } from '@/modules/contactos/services/contactos.service'
import type { ContactoListFilters } from '@/modules/contactos/interfaces/contacto.interface'

export function useContactosQuery(filters: Ref<ContactoListFilters>, enabled?: Ref<boolean>) {
  return useQuery({
    queryKey: computed(() => contactosQueryKeys.list(filters.value)),
    queryFn: () => contactosService.listar(filters.value),
    placeholderData: keepPreviousData,
    enabled: enabled ?? computed(() => true),
  })
}
