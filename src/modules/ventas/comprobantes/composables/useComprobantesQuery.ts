import { useQuery } from '@tanstack/vue-query'
import { computed, type Ref } from 'vue'
import { comprobantesQueryKeys } from '@/modules/ventas/comprobantes/constants/comprobantesQueryKeys'
import { comprobantesService } from '@/modules/ventas/comprobantes/services/comprobantes.service'
import type { ComprobanteListFilters, ResumenDiarioListFilters } from '@/modules/ventas/comprobantes/interfaces/comprobante.interface'

export function useComprobantesQuery(filters: Ref<ComprobanteListFilters>) {
  return useQuery({
    queryKey: computed(() => comprobantesQueryKeys.list(filters.value)),
    queryFn: () => comprobantesService.listar(filters.value),
  })
}

export function useComprobanteQuery(id: Ref<number | null>) {
  return useQuery({
    queryKey: computed(() => comprobantesQueryKeys.detail(id.value ?? 0)),
    queryFn: () => comprobantesService.obtenerPorId(id.value!),
    enabled: computed(() => id.value != null && id.value > 0),
  })
}

export function useComprobanteCatalogosPosQuery() {
  return useQuery({
    queryKey: comprobantesQueryKeys.catalogosPos(),
    queryFn: () => comprobantesService.obtenerCatalogosPos(),
    staleTime: 5 * 60 * 1000,
  })
}

export function useResumenDiarioListQuery(filters: Ref<ResumenDiarioListFilters>) {
  return useQuery({
    queryKey: computed(() => comprobantesQueryKeys.resumenList(filters.value)),
    queryFn: () => comprobantesService.listarResumenDiario(filters.value),
  })
}

export function useResumenDiarioQuery(id: Ref<number | null>) {
  return useQuery({
    queryKey: computed(() => comprobantesQueryKeys.resumenDetail(id.value ?? 0)),
    queryFn: () => comprobantesService.obtenerResumenDiario(id.value!),
    enabled: computed(() => id.value != null && id.value > 0),
  })
}
