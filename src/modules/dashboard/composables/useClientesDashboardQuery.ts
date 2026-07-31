import { useQuery } from '@tanstack/vue-query'
import { computed, type Ref } from 'vue'
import { dashboardQueryKeys } from '@/modules/dashboard/constants/dashboardQueryKeys'
import {
  dashboardService,
  type ClientesDashboardParams,
} from '@/modules/dashboard/services/dashboard.service'

export function useClientesDashboardQuery(params: Ref<ClientesDashboardParams>) {
  return useQuery({
    queryKey: computed(() => [...dashboardQueryKeys.clientes(), params.value]),
    queryFn: () => dashboardService.clientes(params.value),
    staleTime: 60_000,
  })
}
