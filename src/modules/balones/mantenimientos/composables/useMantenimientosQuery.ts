import { keepPreviousData, useQuery } from '@tanstack/vue-query'
import { computed, type Ref } from 'vue'
import { mantenimientosQueryKeys } from '@/modules/balones/mantenimientos/constants/mantenimientosQueryKeys'
import { mantenimientosService } from '@/modules/balones/mantenimientos/services/mantenimientos.service'
import type { MantenimientoListFilters } from '@/modules/balones/mantenimientos/interfaces/mantenimiento.interface'

export function useMantenimientosQuery(filters: Ref<MantenimientoListFilters>) {
  return useQuery({
    queryKey: computed(() => mantenimientosQueryKeys.list(filters.value)),
    queryFn: () => mantenimientosService.listar(filters.value),
    placeholderData: keepPreviousData,
  })
}

export function useMantenimientoQuery(id: Ref<number | null | undefined>) {
  return useQuery({
    queryKey: computed(() => mantenimientosQueryKeys.detail(id.value ?? 0)),
    queryFn: () => mantenimientosService.obtenerPorId(id.value!),
    enabled: computed(() => id.value != null && id.value > 0),
  })
}
