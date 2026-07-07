import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { movimientosQueryKeys } from '@/modules/productos/movimientos/constants/movimientosQueryKeys'
import { movimientosInventarioService } from '@/modules/productos/movimientos/services/movimientos-inventario.service'
import { stockQueryKeys } from '@/modules/productos/stock/constants/stockQueryKeys'
import type {
  CreateMovimientoInventarioPayload,
  UpdateMovimientoInventarioPayload,
} from '@/modules/productos/movimientos/interfaces/movimiento-inventario.interface'
import { toastApiError, toastSuccess } from '@/shared/composables/useToast'

export function useCreateMovimientoInventarioMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateMovimientoInventarioPayload) =>
      movimientosInventarioService.crear(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: movimientosQueryKeys.lists() })
      queryClient.invalidateQueries({ queryKey: stockQueryKeys.lists() })
      toastSuccess('Movimiento registrado correctamente')
    },
    onError: (error) => {
      toastApiError(error, 'No se pudo registrar el movimiento')
    },
  })
}

export function useUpdateMovimientoInventarioMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number
      payload: UpdateMovimientoInventarioPayload
    }) => movimientosInventarioService.actualizar(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: movimientosQueryKeys.all })
      toastSuccess('Movimiento actualizado correctamente')
    },
    onError: (error) => {
      toastApiError(error, 'No se pudo actualizar el movimiento')
    },
  })
}

export function useDeleteMovimientoInventarioMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => movimientosInventarioService.eliminar(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: movimientosQueryKeys.lists() })
      queryClient.invalidateQueries({ queryKey: stockQueryKeys.lists() })
      toastSuccess('Movimiento anulado correctamente')
    },
    onError: (error) => {
      toastApiError(error, 'No se pudo anular el movimiento')
    },
  })
}
