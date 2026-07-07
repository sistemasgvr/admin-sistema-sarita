import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { balonesQueryKeys } from '@/modules/balones/cilindros/constants/balonesQueryKeys'
import { balonesService } from '@/modules/balones/cilindros/services/balones.service'
import type {
  CreateBalonPayload,
  UpdateBalonPayload,
} from '@/modules/balones/cilindros/interfaces/balon.interface'
import { toastApiError, toastSuccess } from '@/shared/composables/useToast'

export function useCreateBalonMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateBalonPayload) => balonesService.crear(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: balonesQueryKeys.lists() })
      queryClient.invalidateQueries({ queryKey: ['tipos-balon'] })
      toastSuccess('Cilindro registrado correctamente')
    },
    onError: (error) => {
      toastApiError(error, 'No se pudo registrar el cilindro')
    },
  })
}

export function useUpdateBalonMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateBalonPayload }) =>
      balonesService.actualizar(id, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: balonesQueryKeys.all })
      queryClient.invalidateQueries({ queryKey: balonesQueryKeys.detail(variables.id) })
      toastSuccess('Cilindro actualizado correctamente')
    },
    onError: (error) => {
      toastApiError(error, 'No se pudo actualizar el cilindro')
    },
  })
}

export function useDeleteBalonMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, idUsuarioAuditoria }: { id: number; idUsuarioAuditoria: number }) =>
      balonesService.eliminar(id, idUsuarioAuditoria),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: balonesQueryKeys.lists() })
      queryClient.invalidateQueries({ queryKey: ['tipos-balon'] })
      toastSuccess('Cilindro eliminado correctamente')
    },
    onError: (error) => {
      toastApiError(error, 'No se pudo eliminar el cilindro')
    },
  })
}
