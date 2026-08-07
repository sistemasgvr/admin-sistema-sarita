import { keepPreviousData, useQuery } from '@tanstack/vue-query'
import { computed, type Ref } from 'vue'
import { recargasPlantaQueryKeys } from '@/modules/balones/recargas/constants/recargasPlantaQueryKeys'
import { recargasPlantaService } from '@/modules/balones/recargas/services/recargas-planta.service'
import type { RecargaPlantaListFilters } from '@/modules/balones/recargas/interfaces/recarga-planta.interface'

export function useRecargasPlantaQuery(filters: Ref<RecargaPlantaListFilters>) {
  return useQuery({
    queryKey: computed(() => recargasPlantaQueryKeys.list(filters.value)),
    queryFn: () => recargasPlantaService.listar(filters.value),
    placeholderData: keepPreviousData,
  })
}

export function useRecargaPlantaQuery(id: Ref<number | null | undefined>) {
  return useQuery({
    queryKey: computed(() => recargasPlantaQueryKeys.detail(id.value ?? 0)),
    queryFn: () => recargasPlantaService.obtenerPorId(id.value!),
    enabled: computed(() => id.value != null && id.value > 0),
  })
}
