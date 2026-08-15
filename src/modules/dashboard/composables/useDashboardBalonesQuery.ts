import { computed, toValue, type MaybeRefOrGetter } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { dashboardQueryKeys } from '@/modules/dashboard/constants/dashboardQueryKeys'
import type { DashboardBalonesQueryParams } from '@/modules/dashboard/interfaces/dashboard.interface'
import { dashboardService } from '@/modules/dashboard/services/dashboard.service'
import { PermisoBanderas } from '@/shared/constants/permissions'

export function useDashboardBalonesQuery(
  params: MaybeRefOrGetter<DashboardBalonesQueryParams> = {},
) {
  const authStore = useAuthStore()
  const resolvedParams = computed(() => toValue(params))

  return useQuery({
    queryKey: computed(() => dashboardQueryKeys.kpiBalones(resolvedParams.value)),
    queryFn: () => dashboardService.kpiBalones(resolvedParams.value),
    enabled: computed(
      () =>
        authStore.isAuthenticated &&
        authStore.hasPermission(PermisoBanderas.DASHBOARD_VER_BALONES),
    ),
  })
}