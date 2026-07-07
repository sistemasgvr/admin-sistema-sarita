import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { stockQueryKeys } from '@/modules/productos/stock/constants/stockQueryKeys'
import { stockService } from '@/modules/productos/stock/services/stock.service'
import type {
  CreateStockPayload,
  UpdateStockPayload,
} from '@/modules/productos/stock/interfaces/stock.interface'
import { toastApiError, toastSuccess } from '@/shared/composables/useToast'

export function useCreateStockMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateStockPayload) => stockService.crear(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: stockQueryKeys.lists() })
      toastSuccess('Stock registrado correctamente')
    },
    onError: (error) => {
      toastApiError(error, 'No se pudo registrar el stock')
    },
  })
}

export function useUpdateStockMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateStockPayload }) =>
      stockService.actualizar(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: stockQueryKeys.all })
      toastSuccess('Stock actualizado correctamente')
    },
    onError: (error) => {
      toastApiError(error, 'No se pudo actualizar el stock')
    },
  })
}

export function useDeleteStockMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => stockService.eliminar(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: stockQueryKeys.lists() })
      toastSuccess('Registro de stock eliminado correctamente')
    },
    onError: (error) => {
      toastApiError(error, 'No se pudo eliminar el registro de stock')
    },
  })
}
