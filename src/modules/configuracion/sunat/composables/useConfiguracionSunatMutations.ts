import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { configuracionSunatQueryKeys } from '@/modules/configuracion/sunat/constants/configuracionSunatQueryKeys'
import { configuracionSunatService } from '@/modules/configuracion/sunat/services/configuracion-sunat.service'
import type {
  CreateConfiguracionSunatPayload,
  UpdateConfiguracionSunatPayload,
} from '@/modules/configuracion/sunat/interfaces/configuracion-sunat.interface'
import { toastApiError, toastSuccess } from '@/shared/composables/useToast'

export function useCreateConfiguracionSunatMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateConfiguracionSunatPayload) =>
      configuracionSunatService.crear(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: configuracionSunatQueryKeys.all })
      toastSuccess('Configuración SUNAT guardada')
    },
    onError: (error) => {
      toastApiError(error, 'No se pudo crear la configuración SUNAT')
    },
  })
}

export function useUpdateConfiguracionSunatMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateConfiguracionSunatPayload }) =>
      configuracionSunatService.actualizar(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: configuracionSunatQueryKeys.all })
      toastSuccess('Configuración SUNAT actualizada')
    },
    onError: (error) => {
      toastApiError(error, 'No se pudo actualizar la configuración SUNAT')
    },
  })
}

export function useDeleteConfiguracionSunatMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => configuracionSunatService.eliminar(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: configuracionSunatQueryKeys.all })
      toastSuccess('Configuración SUNAT eliminada correctamente')
    },
    onError: (error) => {
      toastApiError(error, 'No se pudo eliminar la configuración SUNAT')
    },
  })
}
