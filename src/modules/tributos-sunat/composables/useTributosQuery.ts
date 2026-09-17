import { keepPreviousData, useQuery } from '@tanstack/vue-query'
import { computed, type ComputedRef, type Ref } from 'vue'
import { tributosQueryKeys } from '../constants/tributosQueryKeys'
import { createTributoService } from '../services/tributos.service'
import type { OrigenesElegiblesFilters, TipoTributo, TributoListFilters } from '../interfaces/tributo.interface'

export function useTributosQuery(tipo: TipoTributo, filters: Ref<TributoListFilters>) {
  const service = createTributoService(tipo)
  return useQuery({
    queryKey: computed(() => tributosQueryKeys.list(tipo, filters.value)),
    queryFn: () => service.listar(filters.value),
    placeholderData: keepPreviousData,
  })
}

export function useTributoQuery(tipo: TipoTributo, id: Ref<number | null> | ComputedRef<number | null>) {
  const service = createTributoService(tipo)
  return useQuery({
    queryKey: computed(() => tributosQueryKeys.detail(tipo, id.value ?? 0)),
    queryFn: () => service.obtenerPorId(id.value!),
    enabled: computed(() => id.value != null && id.value > 0),
  })
}

export function useTributoCatalogosQuery(tipo: TipoTributo) {
  const service = createTributoService(tipo)
  return useQuery({
    queryKey: tributosQueryKeys.catalogos(tipo),
    queryFn: () => service.obtenerCatalogos(),
    staleTime: 5 * 60 * 1000,
  })
}

/** Comprobantes/compras sobre los que aún se puede armar el documento; se refresca al cambiar filtros. */
export function useOrigenesElegiblesQuery(
  tipo: TipoTributo,
  filters: Ref<OrigenesElegiblesFilters> | ComputedRef<OrigenesElegiblesFilters>,
) {
  const service = createTributoService(tipo)
  return useQuery({
    queryKey: computed(() => tributosQueryKeys.elegibles(tipo, filters.value)),
    queryFn: () => service.listarOrigenesElegibles(filters.value),
    placeholderData: keepPreviousData,
    staleTime: 0,
  })
}
