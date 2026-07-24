import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { comprasQueryKeys } from '@/modules/compras/constants/comprasQueryKeys'
import { comprasService } from '@/modules/compras/services/compras.service'
import type {
  CreateCompraPayload,
  UpdateCompraPayload,
} from '@/modules/compras/interfaces/compra.interface'
import { toastApiError, toastSuccess } from '@/shared/composables/useToast'

export function useCreateCompraMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateCompraPayload) => comprasService.crear(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: comprasQueryKeys.lists() })
      toastSuccess('Comprobante de compra registrado')
    },
    onError: (error) => {
      toastApiError(error, 'No se pudo registrar el comprobante')
    },
  })
}

export function useUpdateCompraMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateCompraPayload }) =>
      comprasService.actualizar(id, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: comprasQueryKeys.all })
      queryClient.invalidateQueries({ queryKey: comprasQueryKeys.detail(variables.id) })
      toastSuccess('Comprobante de compra actualizado')
    },
    onError: (error) => {
      toastApiError(error, 'No se pudo actualizar el comprobante')
    },
  })
}

export function useDeleteCompraMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, idUsuarioAuditoria }: { id: number; idUsuarioAuditoria: number }) =>
      comprasService.eliminar(id, idUsuarioAuditoria),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: comprasQueryKeys.lists() })
      toastSuccess('Comprobante de compra eliminado')
    },
    onError: (error) => {
      toastApiError(error, 'No se pudo eliminar el comprobante')
    },
  })
}
