import { keepPreviousData, useQuery } from '@tanstack/vue-query'
import { computed, type Ref } from 'vue'
import { finanzasQueryKeys } from '@/modules/finanzas/constants/finanzasQueryKeys'
import { finanzasService } from '@/modules/finanzas/services/finanzas.service'
import type { GarantiaListFilters } from '@/modules/finanzas/interfaces/garantia.interface'

export function useGarantiasQuery(filters: Ref<GarantiaListFilters>) {
  return useQuery({
    queryKey: computed(() => finanzasQueryKeys.garantiasList(filters.value)),
    queryFn: () => finanzasService.listarGarantias(filters.value),
    placeholderData: keepPreviousData,
  })
}

export function useGarantiaDetalleQuery(id: Ref<number | null>) {
  return useQuery({
    queryKey: computed(() => finanzasQueryKeys.garantiaDetalle(id.value ?? 0)),
    queryFn: () => finanzasService.obtenerGarantia(id.value as number),
    enabled: computed(() => id.value != null),
    staleTime: 0,
  })
}
