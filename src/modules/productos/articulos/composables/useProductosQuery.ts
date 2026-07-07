import { keepPreviousData, useQuery } from '@tanstack/vue-query'
import { computed, type Ref } from 'vue'
import { productosQueryKeys } from '@/modules/productos/articulos/constants/productosQueryKeys'
import { productosService } from '@/modules/productos/articulos/services/productos.service'
import type { ProductoListFilters } from '@/modules/productos/articulos/interfaces/producto.interface'

export function useProductosQuery(filters: Ref<ProductoListFilters>) {
  return useQuery({
    queryKey: computed(() => productosQueryKeys.list(filters.value)),
    queryFn: () => productosService.listar(filters.value),
    placeholderData: keepPreviousData,
  })
}
