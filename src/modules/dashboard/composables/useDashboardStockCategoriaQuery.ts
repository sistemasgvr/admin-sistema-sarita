import { computed, toValue, type MaybeRefOrGetter } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { dashboardQueryKeys } from '@/modules/dashboard/constants/dashboardQueryKeys'
import type { DashboardIdAlmacenQueryParams } from '@/modules/dashboard/interfaces/dashboard.interface'
import { dashboardService } from '@/modules/dashboard/services/dashboard.service'
import { PermisoBanderas } from '@/shared/constants/permissions'

export function useDashboardStockCategoriaQuery(
  params: MaybeRefOrGetter<DashboardIdAlmacenQueryParams> = {},
) {
  const authStore = useAuthStore()
  const resolvedParams = computed(() => toValue(params))

  return useQuery({
    queryKey: computed(() => dashboardQueryKeys.stockPorCategoria(resolvedParams.value)),
    queryFn: () => dashboardService.stockPorCategoria(resolvedParams.value),
    enabled: computed(
      () =>
        authStore.isAuthenticated &&
        authStore.hasPermission(PermisoBanderas.DASHBOARD_VER_PRODUCTOS),
    ),
  })
}
