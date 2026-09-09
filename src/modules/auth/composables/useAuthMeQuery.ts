import { useQuery } from '@tanstack/vue-query'
import { storeToRefs } from 'pinia'
import { computed } from 'vue'
import { authQueryKeys } from '@/modules/auth/constants/authQueryKeys'
import { authService } from '@/modules/auth/services/auth.service'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import type { AuthMeResponse } from '@/modules/auth/interfaces/auth.interface'

/** Aplica el perfil vivo de /auth/me sobre la sesión persistida. */
export function syncAuthUserFromMe(data: AuthMeResponse) {
  const authStore = useAuthStore()
  authStore.updateUser({
    nombre: data.nombre ?? authStore.user?.nombre,
    correo: data.correo,
    estado: data.estado ?? authStore.user?.estado,
    id_trabajador: data.id_trabajador ?? null,
    roles: data.roles ?? authStore.user?.roles,
    permisos: data.permisos,
  })
}

export function useAuthMeQuery() {
  const authStore = useAuthStore()
  const { isAuthenticated } = storeToRefs(authStore)

  return useQuery({
    queryKey: authQueryKeys.me(),
    queryFn: async () => {
      const data = await authService.me()
      syncAuthUserFromMe(data)
      return data
    },
    enabled: computed(() => isAuthenticated.value),
    retry: false,
    // Que al volver a la app se refresque ficha/trabajador/permisos.
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  })
}
