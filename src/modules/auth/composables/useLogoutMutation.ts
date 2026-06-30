import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { useRouter } from 'vue-router'
import { authQueryKeys } from '@/modules/auth/constants/authQueryKeys'
import { authService } from '@/modules/auth/services/auth.service'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { toastApiError, toastInfo, toastSuccess } from '@/shared/composables/useToast'

export function useLogoutMutation() {
  const authStore = useAuthStore()
  const queryClient = useQueryClient()
  const router = useRouter()

  return useMutation({
    mutationFn: () => authService.logout(),
    onSuccess: () => {
      authStore.clearSession()
      queryClient.removeQueries({ queryKey: authQueryKeys.all })
      toastSuccess('Sesión cerrada')
      router.push('/')
    },
    onError: (error) => {
      authStore.clearSession()
      queryClient.removeQueries({ queryKey: authQueryKeys.all })
      toastInfo('Sesión cerrada localmente')
      toastApiError(error, 'No se pudo cerrar la sesión en el servidor')
      router.push('/')
    },
  })
}
