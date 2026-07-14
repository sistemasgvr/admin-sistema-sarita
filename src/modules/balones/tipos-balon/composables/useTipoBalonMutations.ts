import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { tiposBalonQueryKeys } from '@/modules/balones/tipos-balon/constants/tiposBalonQueryKeys'
import { tiposBalonService } from '@/modules/balones/tipos-balon/services/tipos-balon.service'
import type {
  CreateTipoBalonPayload,
  UpdateTipoBalonPayload,
} from '@/modules/balones/tipos-balon/interfaces/tipo-balon.interface'
import { toastApiError, toastSuccess } from '@/shared/composables/useToast'

export function useCreateTipoBalonMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateTipoBalonPayload) => tiposBalonService.crear(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tiposBalonQueryKeys.lists() })
      toastSuccess('Tipo de balón creado correctamente')
    },
    onError: (error) => {
      toastApiError(error, 'No se pudo crear el tipo de balón')
    },
  })
}

export function useUpdateTipoBalonMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateTipoBalonPayload }) =>
      tiposBalonService.actualizar(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tiposBalonQueryKeys.all })
      toastSuccess('Tipo de balón actualizado correctamente')
    },
    onError: (error) => {
      toastApiError(error, 'No se pudo actualizar el tipo de balón')
    },
  })
}

export function useDeleteTipoBalonMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, idUsuarioAuditoria }: { id: number; idUsuarioAuditoria: number }) =>
      tiposBalonService.eliminar(id, idUsuarioAuditoria),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tiposBalonQueryKeys.lists() })
      toastSuccess('Tipo de balón eliminado correctamente')
    },
    onError: (error) => {
      toastApiError(error, 'No se pudo eliminar el tipo de balón')
    },
  })
}
