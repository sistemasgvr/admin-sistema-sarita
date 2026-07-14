import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { comprobantesQueryKeys } from '@/modules/ventas/comprobantes/constants/comprobantesQueryKeys'
import { comprobantesService } from '@/modules/ventas/comprobantes/services/comprobantes.service'
import type {
  CreateComprobantePayload,
  EnviarResumenDiarioPayload,
  UpdateComprobantePayload,
} from '@/modules/ventas/comprobantes/interfaces/comprobante.interface'
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

export function useUpdateComprobanteMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateComprobantePayload }) =>
      comprobantesService.actualizar(id, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: comprobantesQueryKeys.lists() })
      queryClient.invalidateQueries({ queryKey: comprobantesQueryKeys.detail(variables.id) })
      toastSuccess('Comprobante actualizado correctamente')
    },
    onError: (error) => {
      toastApiError(error, 'No se pudo actualizar el comprobante')
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

export function useConsultarCdrComprobanteMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, idUsuarioAuditoria }: { id: number; idUsuarioAuditoria: number }) =>
      comprobantesService.consultarCdr(id, idUsuarioAuditoria),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: comprobantesQueryKeys.all })
      queryClient.invalidateQueries({ queryKey: comprobantesQueryKeys.detail(variables.id) })
      toastSuccess(`CDR actualizado: ${data.sunat.estado}`)
    },
    onError: (error) => {
      toastApiError(error, 'No se pudo consultar el CDR')
    },
  })
}

export function useAnularComprobanteMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      idUsuarioAuditoria,
      motivo,
    }: {
      id: number
      idUsuarioAuditoria: number
      motivo: string
    }) => comprobantesService.anular(id, idUsuarioAuditoria, motivo),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: comprobantesQueryKeys.all })
      queryClient.invalidateQueries({ queryKey: comprobantesQueryKeys.detail(variables.id) })
      toastSuccess(`Anulación enviada: ${data.sunat.estado}`)
    },
    onError: (error) => {
      toastApiError(error, 'No se pudo anular el comprobante')
    },
  })
}

export function useEnviarResumenDiarioMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: EnviarResumenDiarioPayload) =>
      comprobantesService.enviarResumenDiario(payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: comprobantesQueryKeys.lists() })
      queryClient.invalidateQueries({ queryKey: comprobantesQueryKeys.resumenLists() })
      toastSuccess(
        data.sunat.ticket
          ? `Resumen ${data.resumen.identificador ?? data.correlativo} enviado. Ticket: ${data.sunat.ticket}`
          : `Resumen enviado: ${data.sunat.estado}`,
      )
    },
    onError: (error) => {
      toastApiError(error, 'No se pudo enviar el resumen diario')
    },
  })
}

export function useConsultarEstadoResumenMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      idUsuarioAuditoria,
    }: {
      id: number
      idUsuarioAuditoria: number
    }) => comprobantesService.consultarEstadoResumen(id, idUsuarioAuditoria),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: comprobantesQueryKeys.resumenLists() })
      queryClient.invalidateQueries({
        queryKey: comprobantesQueryKeys.resumenDetail(variables.id),
      })
      queryClient.invalidateQueries({ queryKey: comprobantesQueryKeys.lists() })
      toastSuccess(`Estado del resumen: ${data.sunat.estado}`)
    },
    onError: (error) => {
      toastApiError(error, 'No se pudo consultar el estado del resumen')
    },
  })
}
