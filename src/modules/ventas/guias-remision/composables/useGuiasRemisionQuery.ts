import { useQuery } from '@tanstack/vue-query'
import { computed, type ComputedRef, type Ref } from 'vue'
import { guiasRemisionQueryKeys } from '@/modules/ventas/guias-remision/constants/guiasRemisionQueryKeys'
import { guiasRemisionService } from '@/modules/ventas/guias-remision/services/guias-remision.service'
import type { GuiaRemisionListFilters } from '@/modules/ventas/guias-remision/interfaces/guia-remision.interface'

export function useGuiasRemisionQuery(filters: Ref<GuiaRemisionListFilters>) {
  return useQuery({
    queryKey: computed(() => guiasRemisionQueryKeys.list(filters.value)),
    queryFn: () => guiasRemisionService.listar(filters.value),
  })
}

export function useGuiaRemisionQuery(id: Ref<number | null> | ComputedRef<number | null>) {
  return useQuery({
    queryKey: computed(() => guiasRemisionQueryKeys.detail(id.value ?? 0)),
    queryFn: () => guiasRemisionService.obtenerPorId(id.value!),
    enabled: computed(() => id.value != null && id.value > 0),
  })
}

export function useGuiaRemisionCatalogosQuery() {
  return useQuery({
    queryKey: guiasRemisionQueryKeys.catalogos(),
    queryFn: () => guiasRemisionService.obtenerCatalogos(),
    staleTime: 5 * 60 * 1000,
  })
}
