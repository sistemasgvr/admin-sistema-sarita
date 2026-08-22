import { keepPreviousData, useQuery } from '@tanstack/vue-query'
import { computed, type Ref } from 'vue'
import { trabajadoresQueryKeys } from '@/modules/trabajadores/constants/trabajadoresQueryKeys'
import { trabajadoresService } from '@/modules/trabajadores/services/trabajadores.service'
import type { TrabajadorListFilters } from '@/modules/trabajadores/interfaces/trabajador.interface'

export function useTrabajadoresQuery(
  filters: Ref<TrabajadorListFilters>,
  enabled?: Ref<boolean>,
) {
  return useQuery({
    queryKey: computed(() => trabajadoresQueryKeys.list(filters.value)),
    queryFn: () => trabajadoresService.listar(filters.value),
    placeholderData: keepPreviousData,
    enabled: enabled ?? computed(() => true),
  })
}

export function useTrabajadorDetailQuery(
  id: Ref<number | undefined>,
  enabled: Ref<boolean>,
) {
  return useQuery({
    queryKey: computed(() => trabajadoresQueryKeys.detail(id.value ?? 0)),
    queryFn: () => trabajadoresService.obtenerPorId(id.value as number),
    enabled: computed(() => enabled.value && !!id.value),
    staleTime: 30 * 1000,
  })
}
