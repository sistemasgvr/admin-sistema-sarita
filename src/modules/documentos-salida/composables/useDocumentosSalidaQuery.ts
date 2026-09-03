import { keepPreviousData, useQuery } from '@tanstack/vue-query'
import { computed, type ComputedRef, type Ref } from 'vue'
import { documentosSalidaQueryKeys } from '@/modules/documentos-salida/constants/documentosSalidaQueryKeys'
import { documentosSalidaService } from '@/modules/documentos-salida/services/documentos-salida.service'
import type { DocumentoSalidaListFilters } from '@/modules/documentos-salida/interfaces/documento-salida.interface'

export function useDocumentosSalidaQuery(filters: Ref<DocumentoSalidaListFilters>) {
  return useQuery({
    queryKey: computed(() => documentosSalidaQueryKeys.list(filters.value)),
    queryFn: () => documentosSalidaService.listar(filters.value),
    placeholderData: keepPreviousData,
  })
}

export function useDocumentoSalidaQuery(id: Ref<number | null> | ComputedRef<number | null>) {
  return useQuery({
    queryKey: computed(() => documentosSalidaQueryKeys.detail(id.value ?? 0)),
    queryFn: () => documentosSalidaService.obtenerPorId(id.value!),
    enabled: computed(() => id.value != null && id.value > 0),
  })
}

export function useDocumentoSalidaCatalogosQuery() {
  return useQuery({
    queryKey: documentosSalidaQueryKeys.catalogos(),
    queryFn: () => documentosSalidaService.obtenerCatalogos(),
    staleTime: 5 * 60 * 1000,
  })
}
