import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { garantiasQueryKeys } from '@/modules/balones/garantias/constants/garantiasQueryKeys'
import type {
  CreateGarantiaPayload,
  DevolverGarantiaPayload,
} from '@/modules/balones/garantias/interfaces/garantia.interface'
import { garantiasService } from '@/modules/balones/garantias/services/garantias.service'
import { toastApiError, toastSuccess } from '@/shared/composables/useToast'

export function useCreateGarantiaMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateGarantiaPayload) => garantiasService.crear(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: garantiasQueryKeys.all })
      toastSuccess('Garantía cobrada correctamente')
    },
    onError: (error) => {
      toastApiError(error, 'No se pudo cobrar la garantía')
    },
  })
}

export function useDevolverGarantiaMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: DevolverGarantiaPayload }) =>
      garantiasService.devolver(id, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: garantiasQueryKeys.all })
      queryClient.invalidateQueries({ queryKey: garantiasQueryKeys.detail(variables.id) })
      toastSuccess('Devolución de garantía registrada')
    },
    onError: (error) => {
      toastApiError(error, 'No se pudo registrar la devolución de garantía')
    },
  })
}
