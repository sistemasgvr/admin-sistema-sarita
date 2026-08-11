import { keepPreviousData, useQuery } from '@tanstack/vue-query'
import { computed, toValue, type MaybeRefOrGetter } from 'vue'
import { rutasPueblosQueryKeys } from '@/modules/balones/rutas-pueblos/constants/rutasPueblosQueryKeys'
import type { RutaPuebloListFilters } from '@/modules/balones/rutas-pueblos/interfaces/ruta-pueblo.interface'
import { rutasPueblosService } from '@/modules/balones/rutas-pueblos/services/rutas-pueblos.service'

export function useRutasPueblosQuery(
  filters: MaybeRefOrGetter<RutaPuebloListFilters>,
) {
  return useQuery({
    queryKey: computed(() => rutasPueblosQueryKeys.list(toValue(filters))),
    queryFn: () => rutasPueblosService.listar(toValue(filters)),
    placeholderData: keepPreviousData,
  })
}

export function useRutaPuebloQuery(id: MaybeRefOrGetter<number | null>) {
  return useQuery({
    queryKey: computed(() => {
      const value = toValue(id)
      return value ? rutasPueblosQueryKeys.detail(value) : ['balones', 'rutas-pueblos', 'detail', 'none']
    }),
    queryFn: () => rutasPueblosService.obtenerPorId(toValue(id)!),
    enabled: computed(() => Boolean(toValue(id))),
  })
}
