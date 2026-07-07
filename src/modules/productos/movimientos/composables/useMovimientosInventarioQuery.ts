import { keepPreviousData, useQuery } from '@tanstack/vue-query'
import { computed, type Ref } from 'vue'
import { movimientosQueryKeys } from '@/modules/productos/movimientos/constants/movimientosQueryKeys'
import { movimientosInventarioService } from '@/modules/productos/movimientos/services/movimientos-inventario.service'
import type { MovimientoInventarioListFilters } from '@/modules/productos/movimientos/interfaces/movimiento-inventario.interface'

export function useMovimientosInventarioQuery(filters: Ref<MovimientoInventarioListFilters>) {
  return useQuery({
    queryKey: computed(() => movimientosQueryKeys.list(filters.value)),
    queryFn: () => movimientosInventarioService.listar(filters.value),
    placeholderData: keepPreviousData,
  })
}
