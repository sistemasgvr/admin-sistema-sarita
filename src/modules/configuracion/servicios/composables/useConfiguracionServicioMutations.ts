import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { configuracionServiciosQueryKeys } from '@/modules/configuracion/servicios/constants/configuracionServiciosQueryKeys'
import { configuracionServiciosService } from '@/modules/configuracion/servicios/services/configuracion-servicios.service'
import type {
  CreateConfiguracionServicioPayload,
  UpdateConfiguracionServicioPayload,
} from '@/modules/configuracion/servicios/interfaces/configuracion-servicio.interface'
import { toastApiError, toastSuccess } from '@/shared/composables/useToast'

export function useCreateConfiguracionServicioMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateConfiguracionServicioPayload) =>
      configuracionServiciosService.crear(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: configuracionServiciosQueryKeys.lists() })
      toastSuccess('Servicio creado correctamente')
    },
    onError: (error) => {
      toastApiError(error, 'No se pudo crear el servicio')
    },
  })
}

export function useUpdateConfiguracionServicioMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateConfiguracionServicioPayload }) =>
      configuracionServiciosService.actualizar(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: configuracionServiciosQueryKeys.all })
      toastSuccess('Servicio actualizado correctamente')
    },
    onError: (error) => {
      toastApiError(error, 'No se pudo actualizar el servicio')
    },
  })
}

export function useDeleteConfiguracionServicioMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => configuracionServiciosService.eliminar(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: configuracionServiciosQueryKeys.lists() })
      toastSuccess('Servicio eliminado correctamente')
    },
    onError: (error) => {
      toastApiError(error, 'No se pudo eliminar el servicio')
    },
  })
}
