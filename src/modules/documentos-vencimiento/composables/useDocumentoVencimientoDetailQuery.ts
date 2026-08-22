import { useQuery } from '@tanstack/vue-query'
import { computed, type Ref } from 'vue'
import { documentosVencimientoQueryKeys } from '@/modules/documentos-vencimiento/constants/documentosVencimientoQueryKeys'
import { documentosVencimientoService } from '@/modules/documentos-vencimiento/services/documentos-vencimiento.service'

export function useDocumentoVencimientoDetailQuery(id: Ref<number | undefined>, enabled: Ref<boolean>) {
  return useQuery({
    queryKey: computed(() => documentosVencimientoQueryKeys.detail(id.value ?? 0)),
    queryFn: () => documentosVencimientoService.obtenerPorId(id.value as number),
    enabled: computed(() => enabled.value && !!id.value),
    staleTime: 30 * 1000,
  })
}
