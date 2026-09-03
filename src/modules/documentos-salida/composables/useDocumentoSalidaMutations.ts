import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { documentosSalidaQueryKeys } from '@/modules/documentos-salida/constants/documentosSalidaQueryKeys'
import { documentosSalidaService } from '@/modules/documentos-salida/services/documentos-salida.service'
import type {
  AnularDocumentoSalidaPayload,
  ConvertirGrePayload,
  CreateDocumentoSalidaDetallePayload,
  CreateDocumentoSalidaPayload,
  CrearDesdeVentaPayload,
  FinalizarRecargaPayload,
  GenerarRecojoDocSalidaPayload,
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

export function useGenerarDocSalidaMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, idUsuarioAuditoria }: { id: number; idUsuarioAuditoria?: number }) =>
      documentosSalidaService.generar(id, idUsuarioAuditoria),
    onSuccess: (_data, variables) => {
      invalidateAll(queryClient, variables.id)
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
      toastSuccess('Retorno de recarga registrado')
    },
    onError: (error) => toastApiError(error, 'No se pudo registrar el retorno'),
  })
}

export function useGenerarRecojoDocSalidaMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: GenerarRecojoDocSalidaPayload }) =>
      documentosSalidaService.generarRecojo(id, payload),
    onSuccess: (_data, variables) => {
      invalidateAll(queryClient, variables.id)
      toastSuccess('Recojo generado')
    },
    onError: (error) => toastApiError(error, 'No se pudo generar el recojo'),
  })
}

export function useAnularDocSalidaMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: AnularDocumentoSalidaPayload }) =>
      documentosSalidaService.anular(id, payload),
    onSuccess: (_data, variables) => {
      invalidateAll(queryClient, variables.id)
      toastSuccess('Documento anulado')
    },
    onError: (error) => toastApiError(error, 'No se pudo anular el documento'),
  })
}
