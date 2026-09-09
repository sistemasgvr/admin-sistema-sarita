import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { authQueryKeys } from '@/modules/auth/constants/authQueryKeys'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { usuariosQueryKeys } from '@/modules/usuarios/constants/usuariosQueryKeys'
import { usuariosService } from '@/modules/usuarios/services/usuarios.service'
import type {
  CreateUsuarioPayload,
  UpdateUsuarioPayload,
} from '@/modules/usuarios/interfaces/usuario.interface'
import { toastApiError, toastSuccess } from '@/shared/composables/useToast'

function invalidateAuthMeIfCurrentUser(queryClient: ReturnType<typeof useQueryClient>, idUsuario: number) {
  const authStore = useAuthStore()
  if (authStore.user?.id !== idUsuario) return
  void authStore.refreshProfile().catch(() => {
    void queryClient.invalidateQueries({ queryKey: authQueryKeys.me() })
  })
}

export function useCreateUsuarioMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateUsuarioPayload) => usuariosService.crear(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: usuariosQueryKeys.all })
      toastSuccess('Usuario creado correctamente')
    },
    onError: (error) => {
      toastApiError(error, 'No se pudo crear el usuario')
    },
  })
}

export function useUpdateUsuarioMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateUsuarioPayload }) =>
      usuariosService.actualizar(id, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: usuariosQueryKeys.all })
      invalidateAuthMeIfCurrentUser(queryClient, variables.id)
      toastSuccess('Usuario actualizado correctamente')
    },
    onError: (error) => {
      toastApiError(error, 'No se pudo actualizar el usuario')
    },
  })
}

export function useDesactivarUsuarioMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => usuariosService.desactivar(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: usuariosQueryKeys.all })
      toastSuccess('Usuario desactivado correctamente')
    },
    onError: (error) => {
      toastApiError(error, 'No se pudo desactivar el usuario')
    },
  })
}

export function useActivarUsuarioMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => usuariosService.activar(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: usuariosQueryKeys.all })
      toastSuccess('Usuario activado correctamente')
    },
    onError: (error) => {
      toastApiError(error, 'No se pudo activar el usuario')
    },
  })
}
