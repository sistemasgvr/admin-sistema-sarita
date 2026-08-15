import { computed, toValue, type MaybeRefOrGetter } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { dashboardQueryKeys } from '@/modules/dashboard/constants/dashboardQueryKeys'
import type { DashboardRangoFechasQueryParams } from '@/modules/dashboard/interfaces/dashboard.interface'
import { dashboardService } from '@/modules/dashboard/services/dashboard.service'
import { PermisoBanderas } from '@/shared/constants/permissions'

export function useDashboardCreditosOtorgadosQuery(
  params: MaybeRefOrGetter<DashboardRangoFechasQueryParams> = {},
) {
  const authStore = useAuthStore()
  const resolvedParams = computed(() => toValue(params))

  return useQuery({
    queryKey: computed(() => dashboardQueryKeys.creditosOtorgados(resolvedParams.value)),
    queryFn: () => dashboardService.creditosOtorgados(resolvedParams.value),
    enabled: computed(
      () => authStore.isAuthenticated && authStore.hasPermission(PermisoBanderas.FINANZAS_CXC_VER),
    ),
  })
}
