import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { invalidateCajaQueries } from '@/modules/caja/composables/useCajaQuery'
import { comprasQueryKeys } from '@/modules/compras/constants/comprasQueryKeys'
import { balonesQueryKeys } from '@/modules/balones/cilindros/constants/balonesQueryKeys'
import { documentosSalidaQueryKeys } from '@/modules/documentos-salida/constants/documentosSalidaQueryKeys'
import { inventarioMovimientosQueryKeys } from '@/modules/inventario/constants/inventarioMovimientosQueryKeys'
import { stockQueryKeys } from '@/modules/productos/stock/constants/stockQueryKeys'
import { stockGasQueryKeys } from '@/modules/balones/stock-gas/constants/stockGasQueryKeys'
import type { RegistrarBalonesCompraPayload } from '@/modules/compras/interfaces/compra.interface'
import { comprasService } from '@/modules/compras/services/compras.service'
import type {
  ActualizarCompraCabeceraPayload,
  ActualizarCompraDetallePayload,
  CreateCompraDetalleLineaPayload,
  CreateCompraPayload,
} from '@/modules/compras/interfaces/compra.interface'
import { toastApiError, toastSuccess } from '@/shared/composables/useToast'

/**
 * Toda operación de compra que toca líneas mueve inventario: ingreso propio, o
 * el gas del retorno de una orden de planta. Stock y kardex se leen en otras
 * pantallas y quedaban mostrando el saldo previo hasta recargar el navegador.
 */
function invalidarInventario(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: stockQueryKeys.all })
  queryClient.invalidateQueries({ queryKey: stockGasQueryKeys.all })
  queryClient.invalidateQueries({ queryKey: inventarioMovimientosQueryKeys.all })
}

export function useCreateCompraMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateCompraPayload) => comprasService.crear(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: comprasQueryKeys.all })
      // La compra puede vincularse a una orden de recarga (y registrar su
      // retorno): el documento de salida cambia y su caché quedaba vieja.
      queryClient.invalidateQueries({ queryKey: documentosSalidaQueryKeys.all })
      invalidarInventario(queryClient)
      void invalidateCajaQueries(queryClient)
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
      void invalidateCajaQueries(queryClient)
      toastSuccess('Cabecera de compra actualizada')
    },
    onError: (error) => {
      toastApiError(error, 'No se pudo actualizar la cabecera')
    },
  })
}

export function useRegistrarBalonesCompraMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: RegistrarBalonesCompraPayload }) =>
      comprasService.registrarBalones(id, payload),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: comprasQueryKeys.all })
      // Los cilindros nuevos aparecen en el libro: su listado queda obsoleto.
      queryClient.invalidateQueries({ queryKey: balonesQueryKeys.all })
      queryClient.invalidateQueries({ queryKey: comprasQueryKeys.detail(variables.id) })
      invalidarInventario(queryClient)
      const total = data?.creados ?? 0
      toastSuccess(
        total === 1 ? 'Cilindro agregado al libro' : `${total} cilindros agregados al libro`,
      )
    },
    onError: (error) => {
      toastApiError(error, 'No se pudieron registrar los cilindros comprados')
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
      // Una línea de gas de una compra de planta ajusta el gas del retorno de
      // la orden: su detalle y sus movimientos cambian.
      queryClient.invalidateQueries({ queryKey: documentosSalidaQueryKeys.all })
      invalidarInventario(queryClient)
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
      queryClient.invalidateQueries({ queryKey: documentosSalidaQueryKeys.all })
      invalidarInventario(queryClient)
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
      queryClient.invalidateQueries({ queryKey: documentosSalidaQueryKeys.all })
      invalidarInventario(queryClient)
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
      // Anular desvincula la orden de planta y ajusta el gas de su retorno:
      // el selector de órdenes y el detalle del documento quedaban con la
      // versión vieja (orden "facturada" que ya no lo está).
      queryClient.invalidateQueries({ queryKey: documentosSalidaQueryKeys.all })
      // Anular revierte los ingresos y el gas del retorno: stock y kardex
      // cambian aunque la anulación se dispare desde el listado de compras.
      invalidarInventario(queryClient)
      queryClient.invalidateQueries({ queryKey: balonesQueryKeys.all })
      void invalidateCajaQueries(queryClient)
      toastSuccess('Comprobante de compra anulado')
    },
    onError: (error) => {
      toastApiError(error, 'No se pudo anular el comprobante')
    },
  })
}
