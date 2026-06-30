import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { rolesQueryKeys } from '@/modules/roles/constants/rolesQueryKeys'
import { rolesService } from '@/modules/roles/services/roles.service'
import type {
  AsignarRolPermisoPayload,
  CreateRolPayload,
  UpdateRolPayload,
} from '@/modules/roles/interfaces/rol.interface'
import { toastApiError, toastSuccess } from '@/shared/composables/useToast'

export function useCreateRolMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateRolPayload) => rolesService.crear(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rolesQueryKeys.lists() })
      toastSuccess('Rol creado correctamente')
    },
    onError: (error) => {
      toastApiError(error, 'No se pudo crear el rol')
    },
  })
}

export function useUpdateRolMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateRolPayload }) =>
      rolesService.actualizar(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rolesQueryKeys.all })
      toastSuccess('Rol actualizado correctamente')
    },
    onError: (error) => {
      toastApiError(error, 'No se pudo actualizar el rol')
    },
  })
}

export function useDeleteRolMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => rolesService.eliminar(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rolesQueryKeys.lists() })
      toastSuccess('Rol eliminado correctamente')
    },
    onError: (error) => {
      toastApiError(error, 'No se pudo eliminar el rol')
    },
  })
}

export function useAsignarRolPermisoMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: AsignarRolPermisoPayload) =>
      rolesService.asignarPermiso(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rolesQueryKeys.all })
    },
    onError: (error) => {
      toastApiError(error, 'No se pudo asignar el permiso')
    },
  })
}

export function useQuitarRolPermisoMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (asignacionId: number) => rolesService.quitarPermiso(asignacionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rolesQueryKeys.all })
    },
    onError: (error) => {
      toastApiError(error, 'No se pudo quitar el permiso')
    },
  })
}
