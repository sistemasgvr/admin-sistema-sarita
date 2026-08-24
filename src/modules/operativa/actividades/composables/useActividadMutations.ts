import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { actividadesQueryKeys } from '@/modules/operativa/actividades/constants/actividadesQueryKeys'
import { comprobantesQueryKeys } from '@/modules/ventas/comprobantes/constants/comprobantesQueryKeys'
import { actividadesService } from '@/modules/operativa/actividades/services/actividades.service'
import type {
  CreateActividadPayload,
  UpdateActividadPayload,
} from '@/modules/operativa/actividades/interfaces/actividad.interface'
import { toastApiError, toastSuccess } from '@/shared/composables/useToast'

export function useCreateActividadMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateActividadPayload) => actividadesService.crear(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: actividadesQueryKeys.all })
      queryClient.invalidateQueries({ queryKey: comprobantesQueryKeys.lists() })
      queryClient.invalidateQueries({ queryKey: comprobantesQueryKeys.details() })
      toastSuccess('Actividad creada correctamente')
    },
    onError: (error) => {
      toastApiError(error, 'No se pudo crear la actividad')
    },
  })
}

export function useUpdateActividadMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateActividadPayload }) =>
      actividadesService.actualizar(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: actividadesQueryKeys.all })
      queryClient.invalidateQueries({ queryKey: comprobantesQueryKeys.lists() })
      queryClient.invalidateQueries({ queryKey: comprobantesQueryKeys.details() })
      toastSuccess('Actividad actualizada correctamente')
    },
    onError: (error) => {
      toastApiError(error, 'No se pudo actualizar la actividad')
    },
  })
}

export function useCancelarActividadMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, idUsuarioAuditoria }: { id: number; idUsuarioAuditoria: number }) =>
      actividadesService.cancelar(id, idUsuarioAuditoria),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: actividadesQueryKeys.all })
      queryClient.invalidateQueries({ queryKey: comprobantesQueryKeys.lists() })
      queryClient.invalidateQueries({ queryKey: comprobantesQueryKeys.details() })
      toastSuccess('Reparto cancelado. El comprobante quedó disponible.')
    },
    onError: (error) => {
      toastApiError(error, 'No se pudo cancelar la actividad')
    },
  })
}

export function useMarcarActividadRealizadaMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, idUsuarioAuditoria }: { id: number; idUsuarioAuditoria: number }) =>
      actividadesService.marcarComoRealizada(id, idUsuarioAuditoria),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: actividadesQueryKeys.all })
      queryClient.invalidateQueries({ queryKey: comprobantesQueryKeys.lists() })
      queryClient.invalidateQueries({ queryKey: comprobantesQueryKeys.details() })
      toastSuccess('Actividad marcada como realizada')
    },
    onError: (error) => {
      toastApiError(error, 'No se pudo marcar la actividad como realizada')
    },
  })
}

export function useDeleteActividadMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, idUsuarioAuditoria }: { id: number; idUsuarioAuditoria: number }) =>
      actividadesService.eliminar(id, idUsuarioAuditoria),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: actividadesQueryKeys.all })
      queryClient.invalidateQueries({ queryKey: comprobantesQueryKeys.lists() })
      queryClient.invalidateQueries({ queryKey: comprobantesQueryKeys.details() })
      toastSuccess('Actividad eliminada correctamente')
    },
    onError: (error) => {
      toastApiError(error, 'No se pudo eliminar la actividad')
    },
  })
}

export function useAsignarResponsableActividadMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      idUsuarioAuditoria,
      idUsuarioResponsable,
      idChoferResponsable,
    }: {
      id: number
      idUsuarioAuditoria: number
      idUsuarioResponsable?: number | null
      idChoferResponsable?: number | null
    }) =>
      actividadesService.asignarResponsable(id, {
        idUsuarioAuditoria,
        idUsuarioResponsable,
        idChoferResponsable,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: actividadesQueryKeys.all })
      queryClient.invalidateQueries({ queryKey: comprobantesQueryKeys.lists() })
      queryClient.invalidateQueries({ queryKey: comprobantesQueryKeys.details() })
      toastSuccess('Responsable actualizado')
    },
    onError: (error) => {
      toastApiError(error, 'No se pudo actualizar el responsable de la actividad')
    },
  })
}
