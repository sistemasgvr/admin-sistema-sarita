import { keepPreviousData, useQuery } from '@tanstack/vue-query'
import { computed, type Ref } from 'vue'
import { actividadesQueryKeys } from '@/modules/operativa/actividades/constants/actividadesQueryKeys'
import { actividadesService } from '@/modules/operativa/actividades/services/actividades.service'
import type { ActividadListFilters } from '@/modules/operativa/actividades/interfaces/actividad.interface'

export function useActividadesQuery(filters: Ref<ActividadListFilters>, enabled?: Ref<boolean>) {
  return useQuery({
    queryKey: computed(() => actividadesQueryKeys.list(filters.value)),
    queryFn: () => actividadesService.listar(filters.value),
    placeholderData: keepPreviousData,
    enabled: enabled ?? computed(() => true),
  })
}
