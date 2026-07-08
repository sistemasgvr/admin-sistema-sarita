import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { balonesQueryKeys } from '@/modules/balones/cilindros/constants/balonesQueryKeys'
import { bajasPendientesQueryKeys } from '@/modules/balones/bajas-pendientes/constants/bajasPendientesQueryKeys'
import { bajasPendientesService } from '@/modules/balones/bajas-pendientes/services/bajas-pendientes.service'
import type {
  AprobarBajaPayload,
  RechazarBajaPayload,
} from '@/modules/balones/bajas-pendientes/interfaces/baja-solicitud.interface'
import { toastApiError, toastSuccess } from '@/shared/composables/useToast'

export function useAprobarBajaMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: AprobarBajaPayload }) =>
      bajasPendientesService.aprobar(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bajasPendientesQueryKeys.all })
      queryClient.invalidateQueries({ queryKey: balonesQueryKeys.all })
      toastSuccess('Baja aprobada correctamente')
    },
    onError: (error) => {
      toastApiError(error, 'No se pudo aprobar la solicitud de baja')
    },
  })
}

export function useRechazarBajaMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: RechazarBajaPayload }) =>
      bajasPendientesService.rechazar(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bajasPendientesQueryKeys.all })
      queryClient.invalidateQueries({ queryKey: balonesQueryKeys.all })
      toastSuccess('Solicitud de baja rechazada')
    },
    onError: (error) => {
      toastApiError(error, 'No se pudo rechazar la solicitud de baja')
    },
  })
}
