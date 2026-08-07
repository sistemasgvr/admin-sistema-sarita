import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { clientesQueryKeys } from '@/modules/clientes/constants/clientesQueryKeys'
import { direccionesQueryKeys } from '@/modules/direcciones/constants/direccionesQueryKeys'
import { direccionesService } from '@/modules/direcciones/services/direcciones.service'
import type {
  CreateDireccionPayload,
  UpdateDireccionPayload,
} from '@/modules/direcciones/interfaces/direccion.interface'
import { toastApiError, toastSuccess } from '@/shared/composables/useToast'

function invalidateDirecciones(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: direccionesQueryKeys.all })
  // Ficha/mapa de cliente pueden depender de dirección principal
  void queryClient.invalidateQueries({ queryKey: clientesQueryKeys.all })
}

export function useCreateDireccionMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateDireccionPayload) => direccionesService.crear(payload),
    onSuccess: () => {
      invalidateDirecciones(queryClient)
      toastSuccess('Dirección creada correctamente')
    },
    onError: (error) => {
      toastApiError(error, 'No se pudo crear la dirección')
    },
  })
}

export function useUpdateDireccionMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateDireccionPayload }) =>
      direccionesService.actualizar(id, payload),
    onSuccess: () => {
      invalidateDirecciones(queryClient)
      toastSuccess('Dirección actualizada correctamente')
    },
    onError: (error) => {
      toastApiError(error, 'No se pudo actualizar la dirección')
    },
  })
}

export function useDeleteDireccionMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, idUsuarioAuditoria }: { id: number; idUsuarioAuditoria: number }) =>
      direccionesService.eliminar(id, idUsuarioAuditoria),
    onSuccess: () => {
      invalidateDirecciones(queryClient)
      toastSuccess('Dirección eliminada correctamente')
    },
    onError: (error) => {
      toastApiError(error, 'No se pudo eliminar la dirección')
    },
  })
}
