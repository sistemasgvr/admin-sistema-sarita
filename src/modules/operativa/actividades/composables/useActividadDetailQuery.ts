import { useQuery } from '@tanstack/vue-query'
import { computed, type Ref } from 'vue'
import { actividadesQueryKeys } from '@/modules/operativa/actividades/constants/actividadesQueryKeys'
import { actividadesService } from '@/modules/operativa/actividades/services/actividades.service'

export function useActividadDetailQuery(id: Ref<number | undefined>, enabled: Ref<boolean>) {
  return useQuery({
    queryKey: computed(() => actividadesQueryKeys.detail(id.value ?? 0)),
    queryFn: () => actividadesService.obtenerPorId(id.value as number),
    enabled: computed(() => enabled.value && !!id.value),
    staleTime: 30 * 1000,
  })
}
