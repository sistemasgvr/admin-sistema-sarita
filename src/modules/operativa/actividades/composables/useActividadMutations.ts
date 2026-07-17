import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { actividadesQueryKeys } from '@/modules/operativa/actividades/constants/actividadesQueryKeys'
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
      queryClient.invalidateQueries({ queryKey: actividadesQueryKeys.lists() })
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
      toastSuccess('Actividad actualizada correctamente')
    },
    onError: (error) => {
      toastApiError(error, 'No se pudo actualizar la actividad')
    },
  })
}

export function useDeleteActividadMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, idUsuarioAuditoria }: { id: number; idUsuarioAuditoria: number }) =>
      actividadesService.eliminar(id, idUsuarioAuditoria),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: actividadesQueryKeys.lists() })
      toastSuccess('Actividad eliminada correctamente')
    },
    onError: (error) => {
      toastApiError(error, 'No se pudo eliminar la actividad')
    },
  })
}
