import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { comprobantesQueryKeys } from '@/modules/ventas/comprobantes/constants/comprobantesQueryKeys'
import { comprobantesService } from '@/modules/ventas/comprobantes/services/comprobantes.service'
import type {
  CreateComprobantePayload,
  EnviarResumenDiarioPayload,
  UpdateComprobantePayload,
} from '@/modules/ventas/comprobantes/interfaces/comprobante.interface'
import { balonesQueryKeys } from '@/modules/balones/cilindros/constants/balonesQueryKeys'
import { invalidateCajaQueries } from '@/modules/caja/composables/useCajaQuery'
import { productosQueryKeys } from '@/modules/productos/articulos/constants/productosQueryKeys'
import { stockQueryKeys } from '@/modules/productos/stock/constants/stockQueryKeys'
import { toastApiError, toastSuccess, toastWarning } from '@/shared/composables/useToast'

export function useCreateComprobanteMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateComprobantePayload) => comprobantesService.crear(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: comprobantesQueryKeys.all })
      queryClient.invalidateQueries({ queryKey: stockQueryKeys.all })
      queryClient.invalidateQueries({ queryKey: productosQueryKeys.all })
      queryClient.invalidateQueries({ queryKey: balonesQueryKeys.all })
      void invalidateCajaQueries(queryClient)
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
      queryClient.invalidateQueries({ queryKey: comprobantesQueryKeys.all })
      queryClient.invalidateQueries({ queryKey: comprobantesQueryKeys.detail(variables.id) })
      void invalidateCajaQueries(queryClient)
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
      queryClient.invalidateQueries({ queryKey: productosQueryKeys.all })
      queryClient.invalidateQueries({ queryKey: balonesQueryKeys.all })
      void invalidateCajaQueries(queryClient)
      const estado = String(data?.sunat?.estado ?? '').toUpperCase()
      if (estado === 'RECHAZADO' || estado === 'ERROR') {
        toastWarning(
          `SUNAT respondió ${estado}: el comprobante no quedó aceptado. Si era una NC, se revirtieron sus efectos de stock.`,
        )
      } else {
        toastSuccess(`Comprobante emitido: ${data.sunat.estado}`)
      }
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
      queryClient.invalidateQueries({ queryKey: comprobantesQueryKeys.all })
      void invalidateCajaQueries(queryClient)
      toastSuccess('Comprobante eliminado correctamente')
    },
    onError: (error) => {
      toastApiError(error, 'No se pudo eliminar el comprobante')
    },
  })
}

/**
 * Cierra la custodia de una venta que no se despacha: sin orden de salida no
 * hay reparto que saque los cilindros de la reserva PENDIENTE_ENVIO, y ahí se
 * quedarían inmovilizados (ni vendibles ni en poder del cliente).
 */
export function useConfirmarEntregaMostradorMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => comprobantesService.confirmarEntregaMostrador(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: comprobantesQueryKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: balonesQueryKeys.all })
    },
    onError: (error) => {
      toastApiError(error, 'La venta se registró, pero no se pudo marcar la entrega en mostrador')
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
      if (data.sunat.estado === 'RECHAZADO') {
        toastWarning(`SUNAT rechazó el comprobante (CDR): ${data.sunat.estado}`)
      } else {
        toastSuccess(`CDR actualizado: ${data.sunat.estado}`)
      }
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
      void invalidateCajaQueries(queryClient)
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
    mutationFn: async (payload: EnviarResumenDiarioPayload) => {
      const data = await comprobantesService.enviarResumenDiario(payload)
      if (!data?.resumen?.id) {
        throw new Error(
          'El envío terminó sin registrar el resumen. Revisa la respuesta de SUNAT o inténtalo de nuevo.',
        )
      }
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: comprobantesQueryKeys.all })
      queryClient.invalidateQueries({ queryKey: comprobantesQueryKeys.resumenLists() })

      const ticket = data.sunat?.ticket
      const estado = data.sunat?.estado ?? 'PENDIENTE'
      toastSuccess(
        ticket
          ? `Resumen ${data.resumen.identificador ?? data.correlativo} enviado. Ticket: ${ticket}`
          : `Resumen enviado: ${estado}`,
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
      queryClient.invalidateQueries({ queryKey: comprobantesQueryKeys.all })
      toastSuccess(`Estado del resumen: ${data.sunat.estado}`)
    },
    onError: (error) => {
      toastApiError(error, 'No se pudo consultar el estado del resumen')
    },
  })
}
