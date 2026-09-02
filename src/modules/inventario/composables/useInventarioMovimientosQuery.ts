import { keepPreviousData, useQuery } from '@tanstack/vue-query'
import { computed, type Ref } from 'vue'
import type { InventarioMovimientoFilters } from '../interfaces/inventario-movimiento.interface'
import { inventarioMovimientosService } from '../services/inventario-movimientos.service'
import { inventarioMovimientosQueryKeys } from '../constants/inventarioMovimientosQueryKeys'

export function useInventarioMovimientosQuery(filters: Ref<InventarioMovimientoFilters>) {
  return useQuery({
    queryKey: computed(() => inventarioMovimientosQueryKeys.list(filters.value)),
    queryFn: () => inventarioMovimientosService.listar(filters.value),
    placeholderData: keepPreviousData,
  })
}

export function useInventarioMovimientoQuery(id: Ref<number | null>) {
  return useQuery({
    queryKey: computed(() => inventarioMovimientosQueryKeys.detail(id.value ?? 0)),
    queryFn: () => inventarioMovimientosService.obtenerPorId(id.value!),
    enabled: computed(() => id.value != null && id.value > 0),
  })
}
