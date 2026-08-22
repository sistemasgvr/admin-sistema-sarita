import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { documentosVencimientoQueryKeys } from '@/modules/documentos-vencimiento/constants/documentosVencimientoQueryKeys'
import { documentosVencimientoService } from '@/modules/documentos-vencimiento/services/documentos-vencimiento.service'
import type {
  CreateDocumentoVencimientoPayload,
  UpdateDocumentoVencimientoPayload,
} from '@/modules/documentos-vencimiento/interfaces/documento-vencimiento.interface'
import { toastApiError, toastSuccess } from '@/shared/composables/useToast'

function invalidateDocumentosVencimiento(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: documentosVencimientoQueryKeys.all })
}

export function useCreateDocumentoVencimientoMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateDocumentoVencimientoPayload) =>
      documentosVencimientoService.crear(payload),
    onSuccess: () => {
      invalidateDocumentosVencimiento(queryClient)
      toastSuccess('Documento registrado correctamente')
    },
    onError: (error) => {
      toastApiError(error, 'No se pudo registrar el documento')
    },
  })
}

export function useUpdateDocumentoVencimientoMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateDocumentoVencimientoPayload }) =>
      documentosVencimientoService.actualizar(id, payload),
    onSuccess: () => {
      invalidateDocumentosVencimiento(queryClient)
      toastSuccess('Documento actualizado correctamente')
    },
    onError: (error) => {
      toastApiError(error, 'No se pudo actualizar el documento')
    },
  })
}

/** Mismo endpoint de actualizar; separado solo para un mensaje de éxito más claro al renovar. */
export function useRenovarDocumentoVencimientoMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateDocumentoVencimientoPayload }) =>
      documentosVencimientoService.actualizar(id, payload),
    onSuccess: () => {
      invalidateDocumentosVencimiento(queryClient)
      toastSuccess('Documento renovado correctamente')
    },
    onError: (error) => {
      toastApiError(error, 'No se pudo renovar el documento')
    },
  })
}

export function useDeleteDocumentoVencimientoMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, idUsuarioAuditoria }: { id: number; idUsuarioAuditoria: number }) =>
      documentosVencimientoService.eliminar(id, idUsuarioAuditoria),
    onSuccess: () => {
      invalidateDocumentosVencimiento(queryClient)
      toastSuccess('Documento eliminado correctamente')
    },
    onError: (error) => {
      toastApiError(error, 'No se pudo eliminar el documento')
    },
  })
}
