import { keepPreviousData, useQuery } from '@tanstack/vue-query'
import { computed, type Ref } from 'vue'
import { recojosQueryKeys } from '@/modules/balones/recojos/constants/recojosQueryKeys'
import { recojosService } from '@/modules/balones/recojos/services/recojos.service'
import type {
  PendienteRecojoFilters,
  RecojoListFilters,
} from '@/modules/balones/recojos/interfaces/recojo.interface'

export function useRecojosQuery(filters: Ref<RecojoListFilters>) {
  return useQuery({
    queryKey: computed(() => recojosQueryKeys.list(filters.value)),
    queryFn: () => recojosService.listar(filters.value),
    placeholderData: keepPreviousData,
  })
}

export function usePendientesRecojoQuery(filters: Ref<PendienteRecojoFilters>) {
  return useQuery({
    queryKey: computed(() => recojosQueryKeys.pendientes(filters.value)),
    queryFn: () => recojosService.listarPendientes(filters.value),
    placeholderData: keepPreviousData,
  })
}

export function useRecojoQuery(id: Ref<number | null | undefined>) {
  return useQuery({
    queryKey: computed(() => recojosQueryKeys.detail(id.value ?? 0)),
    queryFn: () => recojosService.obtenerPorId(id.value!),
    enabled: computed(() => id.value != null && id.value > 0),
  })
}
