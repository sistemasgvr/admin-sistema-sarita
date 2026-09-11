import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { balonesQueryKeys } from '@/modules/balones/cilindros/constants/balonesQueryKeys'
import { stockGasQueryKeys } from '@/modules/balones/stock-gas/constants/stockGasQueryKeys'
import { stockQueryKeys } from '@/modules/productos/stock/constants/stockQueryKeys'
import { toastApiError, toastSuccess } from '@/shared/composables/useToast'
import type { CreateInventarioMovimientoPayload } from '../interfaces/inventario-movimiento.interface'
import { inventarioMovimientosService } from '../services/inventario-movimientos.service'
import { inventarioMovimientosQueryKeys } from '../constants/inventarioMovimientosQueryKeys'

function invalidateInventarioRelacionado(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: inventarioMovimientosQueryKeys.all })
  queryClient.invalidateQueries({ queryKey: stockQueryKeys.all })
  queryClient.invalidateQueries({ queryKey: stockGasQueryKeys.all })
  queryClient.invalidateQueries({ queryKey: balonesQueryKeys.all })
}

export function useCreateInventarioMovimientoMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateInventarioMovimientoPayload) => inventarioMovimientosService.crear(payload),
    onSuccess: () => {
      invalidateInventarioRelacionado(queryClient)
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
      invalidateInventarioRelacionado(queryClient)
      toastSuccess('Movimiento anulado')
    },
    onError: (error) => {
      toastApiError(error, 'No se pudo anular el movimiento')
    },
  })
}
