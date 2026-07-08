import { keepPreviousData, useQuery } from '@tanstack/vue-query'
import { computed, type Ref } from 'vue'
import { alquileresQueryKeys } from '@/modules/balones/alquileres/constants/alquileresQueryKeys'
import { alquileresService } from '@/modules/balones/alquileres/services/alquileres.service'
import type { AlquilerListFilters } from '@/modules/balones/alquileres/interfaces/alquiler.interface'

export function useAlquileresQuery(filters: Ref<AlquilerListFilters>) {
  return useQuery({
    queryKey: computed(() => alquileresQueryKeys.list(filters.value)),
    queryFn: () => alquileresService.listar(filters.value),
    placeholderData: keepPreviousData,
  })
}

export function useAlquilerQuery(id: Ref<number | null | undefined>) {
  return useQuery({
    queryKey: computed(() => alquileresQueryKeys.detail(id.value ?? 0)),
    queryFn: () => alquileresService.obtenerPorId(id.value!),
    enabled: computed(() => id.value != null && id.value > 0),
  })
}
