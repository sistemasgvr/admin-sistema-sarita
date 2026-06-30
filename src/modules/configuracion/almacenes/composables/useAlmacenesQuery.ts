import { keepPreviousData, useQuery } from '@tanstack/vue-query'
import { computed, type Ref } from 'vue'
import { almacenesQueryKeys } from '@/modules/configuracion/almacenes/constants/almacenesQueryKeys'
import { almacenesService } from '@/modules/configuracion/almacenes/services/almacenes.service'
import type { AlmacenListFilters } from '@/modules/configuracion/almacenes/interfaces/almacen.interface'

export function useAlmacenesQuery(filters: Ref<AlmacenListFilters>) {
  return useQuery({
    queryKey: computed(() => almacenesQueryKeys.list(filters.value)),
    queryFn: () => almacenesService.listar(filters.value),
    placeholderData: keepPreviousData,
  })
}
