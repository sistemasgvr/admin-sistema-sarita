import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { movimientosBalonQueryKeys } from '@/modules/balones/movimientos/constants/movimientosBalonQueryKeys'
import { movimientosBalonService } from '@/modules/balones/movimientos/services/movimientos-balon.service'
import type {
  CreateMovimientoBalonPayload,
  UpdateMovimientoBalonPayload,
} from '@/modules/balones/movimientos/interfaces/movimiento-balon.interface'
import { toastApiError, toastSuccess } from '@/shared/composables/useToast'

export function useCreateMovimientoBalonMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateMovimientoBalonPayload) =>
      movimientosBalonService.crear(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: movimientosBalonQueryKeys.lists() })
      toastSuccess('Movimiento registrado correctamente')
    },
    onError: (error) => {
      toastApiError(error, 'No se pudo registrar el movimiento')
    },
  })
}

export function useUpdateMovimientoBalonMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateMovimientoBalonPayload }) =>
      movimientosBalonService.actualizar(id, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: movimientosBalonQueryKeys.all })
      queryClient.invalidateQueries({
        queryKey: movimientosBalonQueryKeys.detail(variables.id),
      })
      toastSuccess('Movimiento actualizado correctamente')
    },
    onError: (error) => {
      toastApiError(error, 'No se pudo actualizar el movimiento')
    },
  })
}

export function useDeleteMovimientoBalonMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, idUsuarioAuditoria }: { id: number; idUsuarioAuditoria: number }) =>
      movimientosBalonService.eliminar(id, idUsuarioAuditoria),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: movimientosBalonQueryKeys.lists() })
      toastSuccess('Movimiento eliminado correctamente')
    },
    onError: (error) => {
      toastApiError(error, 'No se pudo eliminar el movimiento')
    },
  })
}
