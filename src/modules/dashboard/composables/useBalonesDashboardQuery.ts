import { useQuery } from '@tanstack/vue-query'
import { computed, type Ref } from 'vue'
import { dashboardQueryKeys } from '@/modules/dashboard/constants/dashboardQueryKeys'
import { dashboardService } from '@/modules/dashboard/services/dashboard.service'

export function useBalonesDashboardQuery(
  diasAlerta: Ref<number>,
  idCliente: Ref<number | undefined>,
) {
  return useQuery({
    queryKey: computed(() => [
      ...dashboardQueryKeys.balones(),
      diasAlerta.value,
      idCliente.value ?? null,
    ]),
    queryFn: () => dashboardService.balones(diasAlerta.value, idCliente.value),
    staleTime: 60_000,
  })
}
