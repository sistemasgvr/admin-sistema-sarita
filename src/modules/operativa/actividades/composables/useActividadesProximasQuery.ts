import { useQuery } from '@tanstack/vue-query'
import { computed, type Ref } from 'vue'
import { actividadesQueryKeys } from '@/modules/operativa/actividades/constants/actividadesQueryKeys'
import { actividadesService } from '@/modules/operativa/actividades/services/actividades.service'

export function useActividadesProximasQuery(
  minutos: Ref<number> | number = 60,
  enabled: Ref<boolean> | boolean = true,
) {
  const minutosRef = computed(() => (typeof minutos === 'number' ? minutos : minutos.value))
  const enabledRef = computed(() => (typeof enabled === 'boolean' ? enabled : enabled.value))

  return useQuery({
    queryKey: computed(() => actividadesQueryKeys.proximas(minutosRef.value)),
    queryFn: () => actividadesService.listarProximas(minutosRef.value),
    enabled: enabledRef,
    refetchInterval: 30_000,
    staleTime: 15_000,
  })
}
