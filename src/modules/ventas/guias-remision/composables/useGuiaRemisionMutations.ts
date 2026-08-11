import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { guiasRemisionQueryKeys } from '@/modules/ventas/guias-remision/constants/guiasRemisionQueryKeys'
import { guiasRemisionService } from '@/modules/ventas/guias-remision/services/guias-remision.service'
import type {
  CreateGuiaRemisionPayload,
  UpdateGuiaRemisionPayload,
} from '@/modules/ventas/guias-remision/interfaces/guia-remision.interface'
import {
  toastApiError,
  toastError,
  toastSuccess,
  toastWarning,
} from '@/shared/composables/useToast'

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

function mensajeGuiaGuardada(
  accion: 'registrada' | 'actualizada',
  detalles?: { idBalon?: number }[],
) {
  const conCilindros = (detalles ?? []).some((d) => Boolean(d.idBalon))
  return conCilindros
    ? `Guía de remisión ${accion}. Salida de cilindros registrada.`
    : `Guía de remisión ${accion}`
}

export function useCreateGuiaRemisionMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateGuiaRemisionPayload) => guiasRemisionService.crear(payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: guiasRemisionQueryKeys.all })
      toastSuccess(mensajeGuiaGuardada('registrada', variables.detalles))
    },
    onError: (error) => {
      toastApiError(error, 'No se pudo registrar la guía')
    },
  })
}

export function useUpdateGuiaRemisionMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateGuiaRemisionPayload }) =>
      guiasRemisionService.actualizar(id, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: guiasRemisionQueryKeys.all })
      queryClient.invalidateQueries({ queryKey: guiasRemisionQueryKeys.detail(variables.id) })
      toastSuccess(mensajeGuiaGuardada('actualizada', variables.payload.detalles))
    },
    onError: (error) => {
      toastApiError(error, 'No se pudo actualizar la guía')
    },
  })
}

export function useEmitirGuiaRemisionMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, idUsuarioAuditoria }: { id: number; idUsuarioAuditoria: number }) =>
      guiasRemisionService.emitir(id, idUsuarioAuditoria),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: guiasRemisionQueryKeys.all })
      queryClient.invalidateQueries({ queryKey: guiasRemisionQueryKeys.detail(variables.id) })
      toastEstadoSunat('Guía emitida', data.sunat.estado)
    },
    onError: (error) => {
      toastApiError(error, 'No se pudo emitir la guía')
    },
  })
}

export function useConsultarEstadoGuiaRemisionMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, idUsuarioAuditoria }: { id: number; idUsuarioAuditoria: number }) =>
      guiasRemisionService.consultarEstado(id, idUsuarioAuditoria),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: guiasRemisionQueryKeys.all })
      queryClient.invalidateQueries({ queryKey: guiasRemisionQueryKeys.detail(variables.id) })
      toastEstadoSunat('Estado SUNAT', data.sunat.estado)
    },
    onError: (error) => {
      toastApiError(error, 'No se pudo consultar el estado')
    },
  })
}

export function useDeleteGuiaRemisionMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, idUsuarioAuditoria }: { id: number; idUsuarioAuditoria: number }) =>
      guiasRemisionService.eliminar(id, idUsuarioAuditoria),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: guiasRemisionQueryKeys.all })
      toastSuccess('Guía eliminada correctamente')
    },
    onError: (error) => {
      toastApiError(error, 'No se pudo eliminar la guía')
    },
  })
}
