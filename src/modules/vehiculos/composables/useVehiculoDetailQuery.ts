import { useQuery } from '@tanstack/vue-query'
import { computed, type Ref } from 'vue'
import { vehiculosQueryKeys } from '@/modules/vehiculos/constants/vehiculosQueryKeys'
import { vehiculosService } from '@/modules/vehiculos/services/vehiculos.service'

export function useVehiculoDetailQuery(id: Ref<number | undefined>, enabled: Ref<boolean>) {
  return useQuery({
    queryKey: computed(() => vehiculosQueryKeys.detail(id.value ?? 0)),
    queryFn: () => vehiculosService.obtenerPorId(id.value as number),
    enabled: computed(() => enabled.value && !!id.value),
    staleTime: 30 * 1000,
  })
}