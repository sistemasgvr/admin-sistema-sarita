import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { usuariosQueryKeys } from '@/modules/usuarios/constants/usuariosQueryKeys'
import { usuariosRolesService } from '@/modules/usuarios/services/usuarios-roles.service'
import type { AsignarUsuarioRolPayload } from '@/modules/usuarios/interfaces/usuario.interface'
import { toastApiError } from '@/shared/composables/useToast'

export function useAsignarUsuarioRolMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: AsignarUsuarioRolPayload) =>
      usuariosRolesService.asignar(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: usuariosQueryKeys.all })
    },
    onError: (error) => {
      toastApiError(error, 'No se pudo asignar el rol')
    },
  })
}

export function useQuitarUsuarioRolMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (asignacionId: number) => usuariosRolesService.quitar(asignacionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: usuariosQueryKeys.all })
    },
    onError: (error) => {
      toastApiError(error, 'No se pudo quitar el rol')
    },
  })
}
