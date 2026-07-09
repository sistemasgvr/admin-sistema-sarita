import { keepPreviousData, useQuery } from '@tanstack/vue-query'
import { computed, type Ref } from 'vue'
import { vehiculosQueryKeys } from '@/modules/vehiculos/constants/vehiculosQueryKeys'
import { vehiculosService } from '@/modules/vehiculos/services/vehiculos.service'
import type { VehiculoListFilters } from '@/modules/vehiculos/interfaces/vehiculo.interface'

export function useVehiculosQuery(filters: Ref<VehiculoListFilters>) {
  return useQuery({
    queryKey: computed(() => vehiculosQueryKeys.list(filters.value)),
    queryFn: () => vehiculosService.listar(filters.value),
    placeholderData: keepPreviousData,
  })
}
