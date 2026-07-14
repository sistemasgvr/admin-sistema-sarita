import { keepPreviousData, useQuery } from '@tanstack/vue-query'
import { computed, type Ref } from 'vue'
import { movimientosRecargaQueryKeys } from '@/modules/balones/recargas/constants/movimientosRecargaQueryKeys'
import { movimientosRecargaService } from '@/modules/balones/recargas/services/movimientos-recarga.service'
import type { MovimientoRecargaListFilters } from '@/modules/balones/recargas/interfaces/movimiento-recarga.interface'

export function useMovimientosRecargaQuery(filters: Ref<MovimientoRecargaListFilters>) {
  return useQuery({
    queryKey: computed(() => movimientosRecargaQueryKeys.list(filters.value)),
    queryFn: () => movimientosRecargaService.listar(filters.value),
    placeholderData: keepPreviousData,
  })
}

export function useMovimientoRecargaQuery(id: Ref<number | null | undefined>) {
  return useQuery({
    queryKey: computed(() => movimientosRecargaQueryKeys.detail(id.value ?? 0)),
    queryFn: () => movimientosRecargaService.obtenerPorId(id.value!),
    enabled: computed(() => id.value != null && id.value > 0),
  })
}
