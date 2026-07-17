import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { guiasRemisionQueryKeys } from '@/modules/ventas/guias-remision/constants/guiasRemisionQueryKeys'
import { guiasRemisionService } from '@/modules/ventas/guias-remision/services/guias-remision.service'
import type {
  CreateGuiaRemisionPayload,
  UpdateGuiaRemisionPayload,
} from '@/modules/ventas/guias-remision/interfaces/guia-remision.interface'
import { toastApiError, toastSuccess } from '@/shared/composables/useToast'

export function useCreateGuiaRemisionMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateGuiaRemisionPayload) => guiasRemisionService.crear(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: guiasRemisionQueryKeys.lists() })
      toastSuccess('Guía de remisión registrada')
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
      toastSuccess('Guía de remisión actualizada')
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
      toastSuccess(`Guía emitida: ${data.sunat.estado}`)
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
      toastSuccess(`Estado SUNAT: ${data.sunat.estado}`)
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
      queryClient.invalidateQueries({ queryKey: guiasRemisionQueryKeys.lists() })
      toastSuccess('Guía eliminada correctamente')
    },
    onError: (error) => {
      toastApiError(error, 'No se pudo eliminar la guía')
    },
  })
}
