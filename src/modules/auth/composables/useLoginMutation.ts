import { useMutation } from '@tanstack/vue-query'
import { useRouter } from 'vue-router'
import { authService } from '@/modules/auth/services/auth.service'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import type { LoginPayload } from '@/modules/auth/interfaces/auth.interface'
import { toastApiError, toastSuccess } from '@/shared/composables/useToast'

export function useLoginMutation() {
  const authStore = useAuthStore()
  const router = useRouter()

  return useMutation({
    mutationFn: (payload: LoginPayload & { keepLoggedIn?: boolean }) =>
      authService.login({
        correo: payload.correo,
        contrasena: payload.contrasena,
      }),
    onSuccess: (data, variables) => {
      authStore.setSession(data.token, data.usuario, variables.keepLoggedIn ?? false)
      toastSuccess('Sesión iniciada correctamente')
      router.push('/admin/dashboard')
    },
    onError: (error) => {
      toastApiError(error, 'No se pudo iniciar sesión')
    },
  })
}
