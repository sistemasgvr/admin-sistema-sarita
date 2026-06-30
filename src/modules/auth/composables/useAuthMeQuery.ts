import { useQuery } from '@tanstack/vue-query'
import { storeToRefs } from 'pinia'
import { computed } from 'vue'
import { authQueryKeys } from '@/modules/auth/constants/authQueryKeys'
import { authService } from '@/modules/auth/services/auth.service'
import { useAuthStore } from '@/modules/auth/stores/auth.store'

export function useAuthMeQuery() {
  const authStore = useAuthStore()
  const { isAuthenticated } = storeToRefs(authStore)

  return useQuery({
    queryKey: authQueryKeys.me(),
    queryFn: () => authService.me(),
    enabled: computed(() => isAuthenticated.value),
    retry: false,
    select: (data) => {
      authStore.updateUser({
        correo: data.correo,
        permisos: data.permisos,
      })
      return data
    },
  })
}
