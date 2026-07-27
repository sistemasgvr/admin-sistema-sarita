import { computed, type Ref } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { notificacionesQueryKeys } from '@/modules/notificaciones/constants/notificacionesQueryKeys'
import type { NotificacionListFilters } from '@/modules/notificaciones/interfaces/notificacion.interface'
import { notificacionesService } from '@/modules/notificaciones/services/notificaciones.service'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { PermisoBanderas } from '@/shared/constants/permissions'

export function useNotificacionesQuery(filters: Ref<NotificacionListFilters>) {
  const authStore = useAuthStore()

  return useQuery({
    queryKey: computed(() => notificacionesQueryKeys.list(filters.value)),
    queryFn: () => notificacionesService.listar(filters.value),
    enabled: computed(
      () =>
        authStore.isAuthenticated &&
        authStore.hasPermission(PermisoBanderas.NOTIFICACIONES_LISTAR),
    ),
  })
}

export function useNotificacionesContadorQuery() {
  const authStore = useAuthStore()

  return useQuery({
    queryKey: notificacionesQueryKeys.contador(),
    queryFn: () => notificacionesService.contarNoLeidas(),
    enabled: computed(
      () =>
        authStore.isAuthenticated &&
        authStore.hasPermission(PermisoBanderas.NOTIFICACIONES_LISTAR),
    ),
    refetchInterval: 60_000,
  })
}
