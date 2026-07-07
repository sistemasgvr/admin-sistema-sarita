import type { CategoriaProductoListFilters } from '@/modules/productos/categorias/interfaces/categoria-producto.interface'

export const categoriasProductoQueryKeys = {
  all: ['categorias-producto'] as const,
  lists: () => [...categoriasProductoQueryKeys.all, 'list'] as const,
  list: (filters: CategoriaProductoListFilters) =>
    [...categoriasProductoQueryKeys.lists(), filters] as const,
}
