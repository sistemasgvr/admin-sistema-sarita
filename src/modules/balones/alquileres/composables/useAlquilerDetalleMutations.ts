import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { alquileresDetalleQueryKeys } from '@/modules/balones/alquileres/constants/alquileresDetalleQueryKeys'
import { alquileresQueryKeys } from '@/modules/balones/alquileres/constants/alquileresQueryKeys'
import { balonesQueryKeys } from '@/modules/balones/cilindros/constants/balonesQueryKeys'
import { alquileresDetalleService } from '@/modules/balones/alquileres/services/alquileres-detalle.service'
import type {
  CreateAlquilerDetallePayload,
  UpdateAlquilerDetallePayload,
} from '@/modules/balones/alquileres/interfaces/alquiler-detalle.interface'
import { toastApiError, toastSuccess } from '@/shared/composables/useToast'

export function useCreateAlquilerDetalleMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateAlquilerDetallePayload) =>
      alquileresDetalleService.crear(payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: alquileresDetalleQueryKeys.lists() })
      queryClient.invalidateQueries({
        queryKey: alquileresQueryKeys.detail(variables.idAlquiler),
      })
      queryClient.invalidateQueries({ queryKey: alquileresQueryKeys.lists() })
      queryClient.invalidateQueries({ queryKey: balonesQueryKeys.lists() })
      toastSuccess('Cilindro agregado al alquiler')
    },
    onError: (error) => {
      toastApiError(error, 'No se pudo agregar el cilindro')
    },
  })
}

export function useUpdateAlquilerDetalleMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateAlquilerDetallePayload }) =>
      alquileresDetalleService.actualizar(id, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: alquileresDetalleQueryKeys.all })
      queryClient.invalidateQueries({
        queryKey: alquileresDetalleQueryKeys.detail(variables.id),
      })
      queryClient.invalidateQueries({ queryKey: alquileresQueryKeys.lists() })
      toastSuccess('Cilindro actualizado correctamente')
    },
    onError: (error) => {
      toastApiError(error, 'No se pudo actualizar el cilindro')
    },
  })
}

export function useDeleteAlquilerDetalleMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, idUsuarioAuditoria }: { id: number; idUsuarioAuditoria: number }) =>
      alquileresDetalleService.eliminar(id, idUsuarioAuditoria),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: alquileresDetalleQueryKeys.lists() })
      queryClient.invalidateQueries({ queryKey: alquileresQueryKeys.lists() })
      toastSuccess('Cilindro eliminado del alquiler')
    },
    onError: (error) => {
      toastApiError(error, 'No se pudo eliminar el cilindro')
    },
  })
}
