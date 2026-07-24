import { useQuery } from '@tanstack/vue-query'
import { computed, type Ref } from 'vue'
import { productosQueryKeys } from '@/modules/productos/articulos/constants/productosQueryKeys'
import { productosService } from '@/modules/productos/articulos/services/productos.service'

export function useProductoDetailQuery(
  id: Ref<number | undefined>,
  enabled?: Ref<boolean>,
) {
  return useQuery({
    queryKey: computed(() => productosQueryKeys.detail(id.value ?? 0)),
    queryFn: () => productosService.obtenerPorId(id.value as number),
    enabled: computed(() => (enabled?.value ?? true) && !!id.value),
    staleTime: 30 * 1000,
  })
}
