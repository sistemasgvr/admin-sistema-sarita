import { computed, type Ref } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { actividadesQueryKeys } from '@/modules/operativa/actividades/constants/actividadesQueryKeys'
import type { OrigenVencidoRecojoFilters } from '@/modules/operativa/actividades/interfaces/actividad.interface'
import { actividadesService } from '@/modules/operativa/actividades/services/actividades.service'

export function useVencidosRecojoQuery(
  filters: Ref<OrigenVencidoRecojoFilters>,
  enabled: Ref<boolean> | boolean = true,
) {
  const enabledRef = computed(() =>
    typeof enabled === 'boolean' ? enabled : enabled.value,
  )

  return useQuery({
    queryKey: computed(() => actividadesQueryKeys.vencidosRecojo(filters.value)),
    queryFn: () => actividadesService.listarVencidosRecojo(filters.value),
    enabled: enabledRef,
  })
}
