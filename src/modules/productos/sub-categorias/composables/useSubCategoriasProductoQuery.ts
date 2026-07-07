import { keepPreviousData, useQuery } from '@tanstack/vue-query'
import { computed, type Ref } from 'vue'
import { subCategoriasProductoQueryKeys } from '@/modules/productos/sub-categorias/constants/subCategoriasProductoQueryKeys'
import { subCategoriasProductoService } from '@/modules/productos/sub-categorias/services/sub-categorias-producto.service'
import type { SubCategoriaProductoListFilters } from '@/modules/productos/sub-categorias/interfaces/sub-categoria-producto.interface'

export function useSubCategoriasProductoQuery(filters: Ref<SubCategoriaProductoListFilters>) {
  return useQuery({
    queryKey: computed(() => subCategoriasProductoQueryKeys.list(filters.value)),
    queryFn: () => subCategoriasProductoService.listar(filters.value),
    placeholderData: keepPreviousData,
  })
}
