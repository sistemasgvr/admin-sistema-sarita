import { keepPreviousData, useQuery } from '@tanstack/vue-query'
import { computed, type Ref } from 'vue'
import { direccionesQueryKeys } from '@/modules/direcciones/constants/direccionesQueryKeys'
import { direccionesService } from '@/modules/direcciones/services/direcciones.service'
import type { DireccionListFilters } from '@/modules/direcciones/interfaces/direccion.interface'

export function useDireccionesQuery(filters: Ref<DireccionListFilters>) {
  return useQuery({
    queryKey: computed(() => direccionesQueryKeys.list(filters.value)),
    queryFn: () => direccionesService.listar(filters.value),
    placeholderData: keepPreviousData,
  })
}
