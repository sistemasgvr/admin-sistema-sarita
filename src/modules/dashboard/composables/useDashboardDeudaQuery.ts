import { computed, toValue, type MaybeRefOrGetter } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { dashboardQueryKeys } from '@/modules/dashboard/constants/dashboardQueryKeys'
import type { DashboardDeudaQueryParams } from '@/modules/dashboard/interfaces/dashboard.interface'
import { dashboardService, type DashboardTipoDeuda } from '@/modules/dashboard/services/dashboard.service'
import { PermisoBanderas } from '@/shared/constants/permissions'

const PERMISO_POR_TIPO: Record<DashboardTipoDeuda, string> = {
  COBRAR: PermisoBanderas.FINANZAS_CXC_VER,
  PAGAR: PermisoBanderas.FINANZAS_CXP_VER,
}

export function useDashboardDeudaQuery(
  tipo: DashboardTipoDeuda,
  params: MaybeRefOrGetter<DashboardDeudaQueryParams> = {},
  enabled: MaybeRefOrGetter<boolean> = true,
) {
  const authStore = useAuthStore()
  const resolvedParams = computed(() => toValue(params))

  return useQuery({
    queryKey: computed(() => dashboardQueryKeys.deudaCuentas(tipo, resolvedParams.value)),
    queryFn: () => dashboardService.deudaCuentas(tipo, resolvedParams.value),
    enabled: computed(
      () =>
        authStore.isAuthenticated &&
        authStore.hasPermission(PERMISO_POR_TIPO[tipo]) &&
        toValue(enabled),
    ),
  })
}