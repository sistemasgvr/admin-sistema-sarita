import { keepPreviousData, useQuery } from '@tanstack/vue-query'
import { computed, type Ref } from 'vue'
import { movimientosBalonQueryKeys } from '@/modules/balones/movimientos/constants/movimientosBalonQueryKeys'
import { movimientosBalonService } from '@/modules/balones/movimientos/services/movimientos-balon.service'
import type { MovimientoBalonListFilters } from '@/modules/balones/movimientos/interfaces/movimiento-balon.interface'

export function useMovimientosBalonQuery(filters: Ref<MovimientoBalonListFilters>) {
  return useQuery({
    queryKey: computed(() => movimientosBalonQueryKeys.list(filters.value)),
    queryFn: () => movimientosBalonService.listar(filters.value),
    placeholderData: keepPreviousData,
  })
}

export function useMovimientoBalonQuery(id: Ref<number | null | undefined>) {
  return useQuery({
    queryKey: computed(() => movimientosBalonQueryKeys.detail(id.value ?? 0)),
    queryFn: () => movimientosBalonService.obtenerPorId(id.value!),
    enabled: computed(() => id.value != null && id.value > 0),
  })
}
