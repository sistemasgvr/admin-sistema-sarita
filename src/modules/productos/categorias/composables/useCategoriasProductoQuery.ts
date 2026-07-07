import { keepPreviousData, useQuery } from '@tanstack/vue-query'
import { computed, type Ref } from 'vue'
import { categoriasProductoQueryKeys } from '@/modules/productos/categorias/constants/categoriasProductoQueryKeys'
import { categoriasProductoService } from '@/modules/productos/categorias/services/categorias-producto.service'
import type { CategoriaProductoListFilters } from '@/modules/productos/categorias/interfaces/categoria-producto.interface'

export function useCategoriasProductoQuery(filters: Ref<CategoriaProductoListFilters>) {
  return useQuery({
    queryKey: computed(() => categoriasProductoQueryKeys.list(filters.value)),
    queryFn: () => categoriasProductoService.listar(filters.value),
    placeholderData: keepPreviousData,
  })
}
