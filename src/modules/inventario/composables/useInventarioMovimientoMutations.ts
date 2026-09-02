import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { toastApiError, toastSuccess } from '@/shared/composables/useToast'
import type { CreateInventarioMovimientoPayload } from '../interfaces/inventario-movimiento.interface'
import { inventarioMovimientosService } from '../services/inventario-movimientos.service'
import { inventarioMovimientosQueryKeys } from '../constants/inventarioMovimientosQueryKeys'

export function useCreateInventarioMovimientoMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateInventarioMovimientoPayload) => inventarioMovimientosService.crear(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inventarioMovimientosQueryKeys.all })
      toastSuccess('Movimiento registrado')
    },
    onError: (error) => {
      toastApiError(error, 'No se pudo registrar el movimiento')
    },
  })
}

export function useEliminarInventarioMovimientoMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, idUsuarioAuditoria }: { id: number; idUsuarioAuditoria: number }) =>
      inventarioMovimientosService.eliminar(id, idUsuarioAuditoria),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inventarioMovimientosQueryKeys.all })
      toastSuccess('Movimiento anulado')
    },
    onError: (error) => {
      toastApiError(error, 'No se pudo anular el movimiento')
    },
  })
}
