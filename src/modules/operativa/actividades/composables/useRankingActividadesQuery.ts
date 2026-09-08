import { keepPreviousData, useQuery } from '@tanstack/vue-query'
import { computed, type Ref } from 'vue'
import { actividadesQueryKeys } from '@/modules/operativa/actividades/constants/actividadesQueryKeys'
import { actividadesService } from '@/modules/operativa/actividades/services/actividades.service'
import type { RankingActividadesFilters } from '@/modules/operativa/actividades/interfaces/actividad.interface'

/**
 * Ranking por responsable en un rango de fechas (Fase 6, apunte 8.b.i.6).
 *
 * Va aparte del panel de colaboradores, que agrupa lo que ya está cargado en la
 * pantalla: este cuenta contra la base, así que no depende de la paginación ni
 * de los filtros de la tabla.
 */
export function useRankingActividadesQuery(filters: Ref<RankingActividadesFilters>) {
  return useQuery({
    queryKey: computed(() => [...actividadesQueryKeys.all, 'ranking', filters.value] as const),
    queryFn: () => actividadesService.ranking(filters.value),
    placeholderData: keepPreviousData,
  })
}
