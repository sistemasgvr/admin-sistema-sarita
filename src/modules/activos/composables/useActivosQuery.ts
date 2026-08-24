import { keepPreviousData, useQuery } from '@tanstack/vue-query'
import { computed, type Ref } from 'vue'
import { activosQueryKeys } from '@/modules/activos/constants/activosQueryKeys'
import { activosService } from '@/modules/activos/services/activos.service'
import type { ActivoListFilters } from '@/modules/activos/interfaces/activo.interface'

export function useActivosQuery(
  filters: Ref<ActivoListFilters>,
  enabled?: Ref<boolean>,
) {
  return useQuery({
    queryKey: computed(() => activosQueryKeys.list(filters.value)),
    queryFn: () => activosService.listar(filters.value),
    placeholderData: keepPreviousData,
    enabled: enabled ?? computed(() => true),
  })
}

export function useActivoDetailQuery(id: Ref<number | undefined>, enabled: Ref<boolean>) {
  return useQuery({
    queryKey: computed(() => activosQueryKeys.detail(id.value ?? 0)),
    queryFn: () => activosService.obtenerPorId(id.value as number),
    enabled: computed(() => enabled.value && !!id.value),
    staleTime: 30 * 1000,
  })
}
