import { keepPreviousData, useQuery } from '@tanstack/vue-query'
import { computed, type Ref } from 'vue'
import { catalogoPreciosQueryKeys } from '@/modules/productos/catalogo-precios/constants/catalogoPreciosQueryKeys'
import { catalogoPreciosService } from '@/modules/productos/catalogo-precios/services/catalogo-precios.service'
import type { CatalogoPrecioListFilters } from '@/modules/productos/catalogo-precios/interfaces/catalogo-precio.interface'

export function useCatalogoPreciosQuery(filters: Ref<CatalogoPrecioListFilters>) {
  return useQuery({
    queryKey: computed(() => catalogoPreciosQueryKeys.list(filters.value)),
    queryFn: () => catalogoPreciosService.listar(filters.value),
    placeholderData: keepPreviousData,
  })
}
