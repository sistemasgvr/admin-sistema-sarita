import type { CatalogoPrecioListFilters } from '@/modules/productos/catalogo-precios/interfaces/catalogo-precio.interface'

export const catalogoPreciosQueryKeys = {
  all: ['catalogo-precios'] as const,
  lists: () => [...catalogoPreciosQueryKeys.all, 'list'] as const,
  list: (filters: CatalogoPrecioListFilters) =>
    [...catalogoPreciosQueryKeys.lists(), filters] as const,
}
