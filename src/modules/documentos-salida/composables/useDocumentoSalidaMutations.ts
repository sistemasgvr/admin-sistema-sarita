import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { balonesQueryKeys } from '@/modules/balones/cilindros/constants/balonesQueryKeys'
import { stockGasQueryKeys } from '@/modules/balones/stock-gas/constants/stockGasQueryKeys'
import { clientesQueryKeys } from '@/modules/clientes/constants/clientesQueryKeys'
import { comprasQueryKeys } from '@/modules/compras/constants/comprasQueryKeys'
import { direccionesQueryKeys } from '@/modules/direcciones/constants/direccionesQueryKeys'
import { documentosSalidaQueryKeys } from '@/modules/documentos-salida/constants/documentosSalidaQueryKeys'
import { inventarioMovimientosQueryKeys } from '@/modules/inventario/constants/inventarioMovimientosQueryKeys'
import { stockQueryKeys } from '@/modules/productos/stock/constants/stockQueryKeys'
import { documentosSalidaService } from '@/modules/documentos-salida/services/documentos-salida.service'
import type {
  ActualizarDocumentoSalidaDetallePayload,
  ActualizarDocumentoSalidaPayload,
  ActualizarTrasladoPayload,
  AnularDocumentoSalidaPayload,
  ConvertirGrePayload,
  CreateDocumentoSalidaDetallePayload,
  CreateDocumentoSalidaPayload,
  CrearDesdeVentaPayload,
  FinalizarRecargaPayload,
  RegistrarDireccionEntregaPayload,
} from '@/modules/documentos-salida/interfaces/documento-salida.interface'
import { toastApiError, toastError, toastSuccess, toastWarning } from '@/shared/composables/useToast'

function toastEstadoSunat(prefix: string, estado: string) {
  const normalized = (estado ?? '').toUpperCase()
  if (normalized === 'ACEPTADO') {
    toastSuccess(`${prefix}: ACEPTADO`)
    return
  }
  if (normalized === 'PENDIENTE') {
    toastWarning(`${prefix}: PENDIENTE — usa «Consultar estado» en unos segundos`)
    return
  }
  toastError(`${prefix}: ${estado || 'RECHAZADO'}`)
}

function invalidateAll(queryClient: ReturnType<typeof useQueryClient>, id?: number) {
  queryClient.invalidateQueries({ queryKey: documentosSalidaQueryKeys.all })
  if (id != null) {
    queryClient.invalidateQueries({ queryKey: documentosSalidaQueryKeys.detail(id) })
  }
}

/**
 * Generar, anular y registrar retorno mueven inventario (salida de envases,
 * entrada de gas, reversas). Stock, stock de gas y kardex viven en otros
 * módulos y se quedaban con el saldo anterior hasta recargar el navegador.
 */
function invalidarInventario(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: stockQueryKeys.all })
  queryClient.invalidateQueries({ queryKey: stockGasQueryKeys.all })
  queryClient.invalidateQueries({ queryKey: inventarioMovimientosQueryKeys.all })
  queryClient.invalidateQueries({ queryKey: balonesQueryKeys.all })
}

export function useCreateDocumentoSalidaMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateDocumentoSalidaPayload) => documentosSalidaService.crear(payload),
    onSuccess: () => {
      invalidateAll(queryClient)
      toastSuccess('Documento de salida creado')
    },
    onError: (error) => toastApiError(error, 'No se pudo crear el documento de salida'),
  })
}

export function useCrearDesdeVentaMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CrearDesdeVentaPayload) => documentosSalidaService.crearDesdeVenta(payload),
    onSuccess: () => {
      invalidateAll(queryClient)
      toastSuccess('Orden de salida creada desde la venta')
    },
    onError: (error) => toastApiError(error, 'No se pudo crear la orden de salida'),
  })
}

export function useAgregarDetalleDocSalidaMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: CreateDocumentoSalidaDetallePayload }) =>
      documentosSalidaService.agregarDetalle(id, payload),
    onSuccess: (_data, variables) => {
      invalidateAll(queryClient, variables.id)
    },
    onError: (error) => toastApiError(error, 'No se pudo agregar la línea'),
  })
}

export function useEliminarDetalleDocSalidaMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (variables: { detalleId: number; idDocSalida: number; idUsuarioAuditoria?: number }) =>
      documentosSalidaService.eliminarDetalle(variables.detalleId, variables.idUsuarioAuditoria),
    onSuccess: (_data, variables) => {
      invalidateAll(queryClient, variables.idDocSalida)
    },
    onError: (error) => toastApiError(error, 'No se pudo quitar la línea'),
  })
}

export function useActualizarDetalleDocSalidaMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      detalleId,
      payload,
    }: {
      detalleId: number
      idDocSalida: number
      payload: ActualizarDocumentoSalidaDetallePayload
    }) => documentosSalidaService.actualizarDetalle(detalleId, payload),
    onSuccess: (_data, variables) => {
      invalidateAll(queryClient, variables.idDocSalida)
    },
    onError: (error) => toastApiError(error, 'No se pudo actualizar la línea'),
  })
}

export function useActualizarDocSalidaMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: ActualizarDocumentoSalidaPayload }) =>
      documentosSalidaService.actualizar(id, payload),
    onSuccess: (_data, variables) => {
      invalidateAll(queryClient, variables.id)
      toastSuccess('Observaciones actualizadas')
    },
    onError: (error) => toastApiError(error, 'No se pudieron actualizar las observaciones'),
  })
}

export function useActualizarTrasladoMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: ActualizarTrasladoPayload }) =>
      documentosSalidaService.actualizarTraslado(id, payload),
    onSuccess: (_data, variables) => {
      invalidateAll(queryClient, variables.id)
      toastSuccess('Datos de traslado actualizados')
    },
    onError: (error) => toastApiError(error, 'No se pudieron actualizar los datos de traslado'),
  })
}

export function useGenerarDocSalidaMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, idUsuarioAuditoria }: { id: number; idUsuarioAuditoria?: number }) =>
      documentosSalidaService.generar(id, idUsuarioAuditoria),
    onSuccess: (_data, variables) => {
      invalidateAll(queryClient, variables.id)
      invalidarInventario(queryClient)
      toastSuccess('Documento generado')
    },
    onError: (error) => toastApiError(error, 'No se pudo generar el documento'),
  })
}

export function useConvertirAGreMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: ConvertirGrePayload }) =>
      documentosSalidaService.convertirAGre(id, payload),
    onSuccess: (_data, variables) => {
      invalidateAll(queryClient, variables.id)
      toastSuccess('Datos de guía de remisión completados')
    },
    onError: (error) => toastApiError(error, 'No se pudo completar la guía de remisión'),
  })
}

export function useEmitirSunatDocSalidaMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, idUsuarioAuditoria }: { id: number; idUsuarioAuditoria?: number }) =>
      documentosSalidaService.emitirSunat(id, idUsuarioAuditoria),
    onSuccess: (data, variables) => {
      invalidateAll(queryClient, variables.id)
      toastEstadoSunat('Emisión', data.sunat.estado)
    },
    onError: (error) => toastApiError(error, 'No se pudo emitir a SUNAT'),
  })
}

export function useConsultarEstadoDocSalidaMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, idUsuarioAuditoria }: { id: number; idUsuarioAuditoria?: number }) =>
      documentosSalidaService.consultarEstado(id, idUsuarioAuditoria),
    onSuccess: (data, variables) => {
      invalidateAll(queryClient, variables.id)
      toastEstadoSunat('Estado SUNAT', data.sunat.estado)
    },
    onError: (error) => toastApiError(error, 'No se pudo consultar el estado'),
  })
}

export function useRegistrarDireccionEntregaMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: RegistrarDireccionEntregaPayload }) =>
      documentosSalidaService.registrarDireccionEntrega(id, payload),
    onSuccess: (_data, variables) => {
      invalidateAll(queryClient, variables.id)
      // La dirección manual se registra también en cli_direcciones del
      // cliente/proveedor: refrescar su ficha y el mapa de clientes.
      queryClient.invalidateQueries({ queryKey: direccionesQueryKeys.all })
      queryClient.invalidateQueries({ queryKey: clientesQueryKeys.all })
      toastSuccess('Dirección de entrega guardada')
    },
    onError: (error) => toastApiError(error, 'No se pudo guardar la dirección de entrega'),
  })
}

export function useFinalizarRecargaMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: FinalizarRecargaPayload }) =>
      documentosSalidaService.finalizarRecarga(id, payload),
    onSuccess: (_data, variables) => {
      invalidateAll(queryClient, variables.id)
      invalidarInventario(queryClient)
      // El retorno cierra la orden contra su factura: la compra vinculada pasa
      // a mostrar el gas ya ingresado.
      queryClient.invalidateQueries({ queryKey: comprasQueryKeys.all })
      toastSuccess('Retorno de recarga registrado')
    },
    onError: (error) => toastApiError(error, 'No se pudo registrar el retorno'),
  })
}

export function useAnularDocSalidaMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: AnularDocumentoSalidaPayload }) =>
      documentosSalidaService.anular(id, payload),
    onSuccess: (_data, variables) => {
      invalidateAll(queryClient, variables.id)
      invalidarInventario(queryClient)
      toastSuccess('Documento anulado')
    },
    onError: (error) => toastApiError(error, 'No se pudo anular el documento'),
  })
}
