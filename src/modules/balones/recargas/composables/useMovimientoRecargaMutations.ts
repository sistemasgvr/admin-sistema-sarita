import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { movimientosRecargaQueryKeys } from '@/modules/balones/recargas/constants/movimientosRecargaQueryKeys'
import { movimientosRecargaService } from '@/modules/balones/recargas/services/movimientos-recarga.service'
import type {
  CreateMovimientoRecargaPayload,
  UpdateMovimientoRecargaPayload,
} from '@/modules/balones/recargas/interfaces/movimiento-recarga.interface'
import { toastApiError, toastSuccess } from '@/shared/composables/useToast'

export function useCreateMovimientoRecargaMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateMovimientoRecargaPayload) =>
      movimientosRecargaService.crear(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: movimientosRecargaQueryKeys.lists() })
      toastSuccess('Recarga registrada correctamente')
    },
    onError: (error) => {
      toastApiError(error, 'No se pudo registrar la recarga')
    },
  })
}

export function useUpdateMovimientoRecargaMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateMovimientoRecargaPayload }) =>
      movimientosRecargaService.actualizar(id, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: movimientosRecargaQueryKeys.all })
      queryClient.invalidateQueries({
        queryKey: movimientosRecargaQueryKeys.detail(variables.id),
      })
      toastSuccess('Recarga actualizada correctamente')
    },
    onError: (error) => {
      toastApiError(error, 'No se pudo actualizar la recarga')
    },
  })
}

export function useDeleteMovimientoRecargaMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, idUsuarioAuditoria }: { id: number; idUsuarioAuditoria: number }) =>
      movimientosRecargaService.eliminar(id, idUsuarioAuditoria),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: movimientosRecargaQueryKeys.lists() })
      toastSuccess('Recarga eliminada correctamente')
    },
    onError: (error) => {
      toastApiError(error, 'No se pudo eliminar la recarga')
    },
  })
}
