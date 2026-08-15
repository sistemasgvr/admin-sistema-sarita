import { computed, toValue, type MaybeRefOrGetter } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { dashboardQueryKeys } from '@/modules/dashboard/constants/dashboardQueryKeys'
import type { DashboardClientesMoraQueryParams } from '@/modules/dashboard/interfaces/dashboard.interface'
import { dashboardService } from '@/modules/dashboard/services/dashboard.service'
import { PermisoBanderas } from '@/shared/constants/permissions'

export function useDashboardClientesMoraQuery(
  params: MaybeRefOrGetter<DashboardClientesMoraQueryParams> = {},
) {
  const authStore = useAuthStore()
  const resolvedParams = computed(() => toValue(params))

  return useQuery({
    queryKey: computed(() => dashboardQueryKeys.clientesMora(resolvedParams.value)),
    queryFn: () => dashboardService.clientesMora(resolvedParams.value),
    enabled: computed(
      () =>
        authStore.isAuthenticated &&
        authStore.hasPermission(PermisoBanderas.DASHBOARD_VER_CLIENTES),
    ),
  })
}
