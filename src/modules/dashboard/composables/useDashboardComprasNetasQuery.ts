import { computed, toValue, type MaybeRefOrGetter } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { dashboardQueryKeys } from '@/modules/dashboard/constants/dashboardQueryKeys'
import type { DashboardComprasNetasQueryParams } from '@/modules/dashboard/interfaces/dashboard.interface'
import { dashboardService } from '@/modules/dashboard/services/dashboard.service'
import { PermisoBanderas } from '@/shared/constants/permissions'

export function useDashboardComprasNetasQuery(
  params: MaybeRefOrGetter<DashboardComprasNetasQueryParams> = {},
) {
  const authStore = useAuthStore()
  const resolvedParams = computed(() => toValue(params))

  return useQuery({
    queryKey: computed(() => dashboardQueryKeys.comprasNetas(resolvedParams.value)),
    queryFn: () => dashboardService.comprasNetas(resolvedParams.value),
    enabled: computed(
      () =>
        authStore.isAuthenticated &&
        authStore.hasPermission(PermisoBanderas.DASHBOARD_VER_COMPRAS),
    ),
  })
}