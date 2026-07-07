import type { SubCategoriaProductoListFilters } from '@/modules/productos/sub-categorias/interfaces/sub-categoria-producto.interface'

export const subCategoriasProductoQueryKeys = {
  all: ['sub-categorias-producto'] as const,
  lists: () => [...subCategoriasProductoQueryKeys.all, 'list'] as const,
  list: (filters: SubCategoriaProductoListFilters) =>
    [...subCategoriasProductoQueryKeys.lists(), filters] as const,
}
