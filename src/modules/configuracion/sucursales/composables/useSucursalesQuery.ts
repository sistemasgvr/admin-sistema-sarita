import { keepPreviousData, useQuery } from '@tanstack/vue-query'
import { computed, type Ref } from 'vue'
import { sucursalesQueryKeys } from '@/modules/configuracion/sucursales/constants/sucursalesQueryKeys'
import { sucursalesService } from '@/modules/configuracion/sucursales/services/sucursales.service'
import type { SucursalListFilters } from '@/modules/configuracion/sucursales/interfaces/sucursal.interface'

export function useSucursalesQuery(filters: Ref<SucursalListFilters>) {
  return useQuery({
    queryKey: computed(() => sucursalesQueryKeys.list(filters.value)),
    queryFn: () => sucursalesService.listar(filters.value),
    placeholderData: keepPreviousData,
  })
}
