import { useQuery } from '@tanstack/vue-query'
import { computed, type Ref } from 'vue'
import { garantiasQueryKeys } from '@/modules/balones/garantias/constants/garantiasQueryKeys'
import type { GarantiaListFilters } from '@/modules/balones/garantias/interfaces/garantia.interface'
import { garantiasService } from '@/modules/balones/garantias/services/garantias.service'

export function useGarantiasQuery(filters: Ref<GarantiaListFilters>) {
  return useQuery({
    queryKey: computed(() => garantiasQueryKeys.list(filters.value)),
    queryFn: () => garantiasService.listar(filters.value),
  })
}

export function useGarantiaQuery(id: Ref<number | null | undefined>) {
  return useQuery({
    queryKey: computed(() => garantiasQueryKeys.detail(id.value ?? 0)),
    queryFn: () => garantiasService.obtenerPorId(Number(id.value)),
    enabled: computed(() => Boolean(id.value)),
  })
}
