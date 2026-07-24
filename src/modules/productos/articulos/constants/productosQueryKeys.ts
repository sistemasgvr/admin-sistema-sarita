import type { ProductoListFilters } from '@/modules/productos/articulos/interfaces/producto.interface'

export const productosQueryKeys = {
  all: ['productos'] as const,
  lists: () => [...productosQueryKeys.all, 'list'] as const,
  list: (filters: ProductoListFilters) => [...productosQueryKeys.lists(), filters] as const,
  details: () => [...productosQueryKeys.all, 'detail'] as const,
  detail: (id: number) => [...productosQueryKeys.details(), id] as const,
}
