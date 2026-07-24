import { keepPreviousData, useQuery } from '@tanstack/vue-query'
import { computed, type Ref } from 'vue'
import { alquileresAntiguedadQueryKeys } from '@/modules/balones/alquileres/constants/alquileresAntiguedadQueryKeys'
import { alquileresAntiguedadService } from '@/modules/balones/alquileres/services/alquileres-antiguedad.service'
import type { AlquilerAntiguedadFilters } from '@/modules/balones/alquileres/interfaces/alquiler-antiguedad.interface'

export function useAlquileresAntiguedadQuery(filters: Ref<AlquilerAntiguedadFilters>) {
  return useQuery({
    queryKey: computed(() => alquileresAntiguedadQueryKeys.list(filters.value)),
    queryFn: () => alquileresAntiguedadService.listar(filters.value),
    placeholderData: keepPreviousData,
  })
}
