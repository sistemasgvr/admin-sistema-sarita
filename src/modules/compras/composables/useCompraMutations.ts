import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { comprasQueryKeys } from '@/modules/compras/constants/comprasQueryKeys'
import { comprasService } from '@/modules/compras/services/compras.service'
import type {
  ActualizarCompraCabeceraPayload,
  ActualizarCompraDetallePayload,
  CreateCompraDetalleLineaPayload,
  CreateCompraPayload,
} from '@/modules/compras/interfaces/compra.interface'
import { toastApiError, toastSuccess } from '@/shared/composables/useToast'

export function useCreateCompraMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateCompraPayload) => comprasService.crear(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: comprasQueryKeys.all })
      toastSuccess('Comprobante de compra registrado')
    },
    onError: (error) => {
      toastApiError(error, 'No se pudo registrar el comprobante')
    },
  })
}

export function useActualizarCabeceraMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: ActualizarCompraCabeceraPayload }) =>
      comprasService.actualizarCabecera(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: comprasQueryKeys.all })
      toastSuccess('Cabecera de compra actualizada')
    },
    onError: (error) => {
      toastApiError(error, 'No se pudo actualizar la cabecera')
    },
  })
}

export function useCrearDetalleMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: CreateCompraDetalleLineaPayload }) =>
      comprasService.crearDetalle(id, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: comprasQueryKeys.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: comprasQueryKeys.all })
      toastSuccess('Línea agregada a la compra')
    },
    onError: (error) => {
      toastApiError(error, 'No se pudo agregar la línea')
    },
  })
}

export function useActualizarDetalleMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      idDetalle,
      payload,
    }: {
      idDetalle: number
      payload: ActualizarCompraDetallePayload
    }) => comprasService.actualizarDetalle(idDetalle, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: comprasQueryKeys.all })
      toastSuccess('Línea actualizada (stock ajustado si aplica)')
    },
    onError: (error) => {
      toastApiError(error, 'No se pudo actualizar la línea')
    },
  })
}

export function useEliminarDetalleMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ idDetalle, idUsuarioAuditoria }: { idDetalle: number; idUsuarioAuditoria: number }) =>
      comprasService.eliminarDetalle(idDetalle, idUsuarioAuditoria),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: comprasQueryKeys.all })
      toastSuccess('Línea eliminada de la compra')
    },
    onError: (error) => {
      toastApiError(error, 'No se pudo eliminar la línea')
    },
  })
}

export function useAnularCompraMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, idUsuarioAuditoria }: { id: number; idUsuarioAuditoria: number }) =>
      comprasService.anular(id, idUsuarioAuditoria),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: comprasQueryKeys.all })
      toastSuccess('Comprobante de compra anulado')
    },
    onError: (error) => {
      toastApiError(error, 'No se pudo anular el comprobante')
    },
  })
}
