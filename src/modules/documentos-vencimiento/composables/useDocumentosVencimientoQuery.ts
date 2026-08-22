import { keepPreviousData, useQuery } from '@tanstack/vue-query'
import { computed, type Ref } from 'vue'
import { documentosVencimientoQueryKeys } from '@/modules/documentos-vencimiento/constants/documentosVencimientoQueryKeys'
import { documentosVencimientoService } from '@/modules/documentos-vencimiento/services/documentos-vencimiento.service'
import type { DocumentoVencimientoListFilters } from '@/modules/documentos-vencimiento/interfaces/documento-vencimiento.interface'

export function useDocumentosVencimientoQuery(filters: Ref<DocumentoVencimientoListFilters>) {
  return useQuery({
    queryKey: computed(() => documentosVencimientoQueryKeys.list(filters.value)),
    queryFn: () => documentosVencimientoService.listar(filters.value),
    placeholderData: keepPreviousData,
  })
}
