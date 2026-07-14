import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { comprobantesQueryKeys } from '@/modules/ventas/comprobantes/constants/comprobantesQueryKeys'
import { comprobantesService } from '@/modules/ventas/comprobantes/services/comprobantes.service'
import type { CreateComprobantePayload } from '@/modules/ventas/comprobantes/interfaces/comprobante.interface'
import { balonesQueryKeys } from '@/modules/balones/cilindros/constants/balonesQueryKeys'
import { productosQueryKeys } from '@/modules/productos/articulos/constants/productosQueryKeys'
import { stockQueryKeys } from '@/modules/productos/stock/constants/stockQueryKeys'
import { toastApiError, toastSuccess } from '@/shared/composables/useToast'

export function useCreateComprobanteMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateComprobantePayload) => comprobantesService.crear(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: comprobantesQueryKeys.lists() })
      queryClient.invalidateQueries({ queryKey: stockQueryKeys.all })
      queryClient.invalidateQueries({ queryKey: productosQueryKeys.lists() })
      queryClient.invalidateQueries({ queryKey: balonesQueryKeys.lists() })
      toastSuccess('Comprobante registrado correctamente')
    },
    onError: (error) => {
      toastApiError(error, 'No se pudo registrar el comprobante')
    },
  })
}

export function useEmitirComprobanteMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, idUsuarioAuditoria }: { id: number; idUsuarioAuditoria: number }) =>
      comprobantesService.emitir(id, idUsuarioAuditoria),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: comprobantesQueryKeys.all })
      queryClient.invalidateQueries({ queryKey: comprobantesQueryKeys.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: stockQueryKeys.all })
      queryClient.invalidateQueries({ queryKey: productosQueryKeys.lists() })
      queryClient.invalidateQueries({ queryKey: balonesQueryKeys.lists() })
      toastSuccess(`Comprobante emitido: ${data.sunat.estado}`)
    },
    onError: (error) => {
      toastApiError(error, 'No se pudo emitir el comprobante')
    },
  })
}

export function useDeleteComprobanteMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, idUsuarioAuditoria }: { id: number; idUsuarioAuditoria: number }) =>
      comprobantesService.eliminar(id, idUsuarioAuditoria),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: comprobantesQueryKeys.lists() })
      toastSuccess('Comprobante eliminado correctamente')
    },
    onError: (error) => {
      toastApiError(error, 'No se pudo eliminar el comprobante')
    },
  })
}
