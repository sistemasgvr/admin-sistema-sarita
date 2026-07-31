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

export function useMovimientoInventarioQuery(
  id: Ref<number | null | undefined>,
  enabled?: Ref<boolean>,
) {
  return useQuery({
    queryKey: computed(() => movimientosQueryKeys.detail(id.value ?? 0)),
    queryFn: () => movimientosInventarioService.obtenerPorId(id.value as number),
    enabled: computed(() => (enabled?.value ?? true) && !!id.value),
    staleTime: 30 * 1000,
  })
}
