import { computed } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { dashboardQueryKeys } from '@/modules/dashboard/constants/dashboardQueryKeys'
import { dashboardService } from '@/modules/dashboard/services/dashboard.service'
import { PermisoBanderas } from '@/shared/constants/permissions'

export function useDashboardGarantiasAlquilerQuery() {
  const authStore = useAuthStore()

  return useQuery({
    queryKey: dashboardQueryKeys.garantiasAlquiler(),
    queryFn: () => dashboardService.garantiasAlquiler(),
    enabled: computed(
      () =>
        authStore.isAuthenticated &&
        authStore.hasPermission(PermisoBanderas.DASHBOARD_VER_GARANTIAS),
    ),
  })
}
