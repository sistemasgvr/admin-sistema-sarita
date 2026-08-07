import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { choferesQueryKeys } from '@/modules/choferes/constants/choferesQueryKeys'
import { choferesService } from '@/modules/choferes/services/choferes.service'
import type {
  CreateChoferPayload,
  UpdateChoferPayload,
} from '@/modules/choferes/interfaces/chofer.interface'
import { toastApiError, toastSuccess } from '@/shared/composables/useToast'

function invalidateChoferes(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: choferesQueryKeys.all })
}

export function useCreateChoferMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateChoferPayload) => choferesService.crear(payload),
    onSuccess: () => {
      invalidateChoferes(queryClient)
      toastSuccess('Chofer creado correctamente')
    },
    onError: (error) => {
      toastApiError(error, 'No se pudo crear el chofer')
    },
  })
}

export function useUpdateChoferMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateChoferPayload }) =>
      choferesService.actualizar(id, payload),
    onSuccess: () => {
      invalidateChoferes(queryClient)
      toastSuccess('Chofer actualizado correctamente')
    },
    onError: (error) => {
      toastApiError(error, 'No se pudo actualizar el chofer')
    },
  })
}

export function useDeleteChoferMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, idUsuarioAuditoria }: { id: number; idUsuarioAuditoria: number }) =>
      choferesService.eliminar(id, idUsuarioAuditoria),
    onSuccess: () => {
      invalidateChoferes(queryClient)
      toastSuccess('Chofer eliminado correctamente')
    },
    onError: (error) => {
      toastApiError(error, 'No se pudo eliminar el chofer')
    },
  })
}
