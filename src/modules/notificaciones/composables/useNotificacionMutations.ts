import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { notificacionesQueryKeys } from '@/modules/notificaciones/constants/notificacionesQueryKeys'
import { notificacionesService } from '@/modules/notificaciones/services/notificaciones.service'
import { toastApiError, toastSuccess } from '@/shared/composables/useToast'

export function useMarcarNotificacionLeidaMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => notificacionesService.marcarLeida(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: notificacionesQueryKeys.all })
    },
    onError: (error) => toastApiError(error, 'No se pudo marcar como leída'),
  })
}

export function useMarcarTodasNotificacionesLeidasMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => notificacionesService.marcarTodasLeidas(),
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: notificacionesQueryKeys.all })
      toastSuccess(
        result.actualizadas > 0
          ? `${result.actualizadas} notificación(es) marcadas como leídas`
          : 'No había notificaciones pendientes',
      )
    },
    onError: (error) => toastApiError(error, 'No se pudieron marcar como leídas'),
  })
}
