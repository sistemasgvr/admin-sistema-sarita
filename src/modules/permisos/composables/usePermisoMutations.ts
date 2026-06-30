import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { permisosQueryKeys } from '@/modules/permisos/constants/permisosQueryKeys'
import { permisosService } from '@/modules/permisos/services/permisos.service'
import type {
  CreatePermisoPayload,
  UpdatePermisoPayload,
} from '@/modules/permisos/interfaces/permiso.interface'
import { toastApiError, toastSuccess } from '@/shared/composables/useToast'

export function useCreatePermisoMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreatePermisoPayload) => permisosService.crear(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: permisosQueryKeys.lists() })
      toastSuccess('Permiso creado correctamente')
    },
    onError: (error) => {
      toastApiError(error, 'No se pudo crear el permiso')
    },
  })
}

export function useUpdatePermisoMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdatePermisoPayload }) =>
      permisosService.actualizar(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: permisosQueryKeys.all })
      toastSuccess('Permiso actualizado correctamente')
    },
    onError: (error) => {
      toastApiError(error, 'No se pudo actualizar el permiso')
    },
  })
}

export function useDeletePermisoMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => permisosService.eliminar(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: permisosQueryKeys.lists() })
      toastSuccess('Permiso eliminado correctamente')
    },
    onError: (error) => {
      toastApiError(error, 'No se pudo eliminar el permiso')
    },
  })
}
