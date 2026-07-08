import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { alquileresQueryKeys } from '@/modules/balones/alquileres/constants/alquileresQueryKeys'
import { alquileresService } from '@/modules/balones/alquileres/services/alquileres.service'
import type {
  CreateAlquilerPayload,
  UpdateAlquilerPayload,
} from '@/modules/balones/alquileres/interfaces/alquiler.interface'
import { toastApiError, toastSuccess } from '@/shared/composables/useToast'

export function useCreateAlquilerMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateAlquilerPayload) => alquileresService.crear(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: alquileresQueryKeys.lists() })
      toastSuccess('Alquiler registrado correctamente')
    },
    onError: (error) => {
      toastApiError(error, 'No se pudo registrar el alquiler')
    },
  })
}

export function useUpdateAlquilerMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateAlquilerPayload }) =>
      alquileresService.actualizar(id, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: alquileresQueryKeys.all })
      queryClient.invalidateQueries({ queryKey: alquileresQueryKeys.detail(variables.id) })
      toastSuccess('Alquiler actualizado correctamente')
    },
    onError: (error) => {
      toastApiError(error, 'No se pudo actualizar el alquiler')
    },
  })
}

export function useDeleteAlquilerMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, idUsuarioAuditoria }: { id: number; idUsuarioAuditoria: number }) =>
      alquileresService.eliminar(id, idUsuarioAuditoria),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: alquileresQueryKeys.lists() })
      toastSuccess('Alquiler eliminado correctamente')
    },
    onError: (error) => {
      toastApiError(error, 'No se pudo eliminar el alquiler')
    },
  })
}
