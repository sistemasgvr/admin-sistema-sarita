import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { direccionesQueryKeys } from '@/modules/direcciones/constants/direccionesQueryKeys'
import { direccionesService } from '@/modules/direcciones/services/direcciones.service'
import type {
  CreateDireccionPayload,
  UpdateDireccionPayload,
} from '@/modules/direcciones/interfaces/direccion.interface'
import { toastApiError, toastSuccess } from '@/shared/composables/useToast'

export function useCreateDireccionMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateDireccionPayload) => direccionesService.crear(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: direccionesQueryKeys.lists() })
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
      queryClient.invalidateQueries({ queryKey: direccionesQueryKeys.all })
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
      queryClient.invalidateQueries({ queryKey: direccionesQueryKeys.lists() })
      toastSuccess('Dirección eliminada correctamente')
    },
    onError: (error) => {
      toastApiError(error, 'No se pudo eliminar la dirección')
    },
  })
}
