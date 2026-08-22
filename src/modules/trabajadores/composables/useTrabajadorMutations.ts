import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { trabajadoresQueryKeys } from '@/modules/trabajadores/constants/trabajadoresQueryKeys'
import { trabajadoresService } from '@/modules/trabajadores/services/trabajadores.service'
import type {
  CreateTrabajadorPayload,
  UpdateTrabajadorPayload,
} from '@/modules/trabajadores/interfaces/trabajador.interface'
import { toastApiError, toastSuccess } from '@/shared/composables/useToast'

function invalidateTrabajadores(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: trabajadoresQueryKeys.all })
}

export function useCreateTrabajadorMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateTrabajadorPayload) => trabajadoresService.crear(payload),
    onSuccess: () => {
      invalidateTrabajadores(queryClient)
      toastSuccess('Trabajador creado correctamente')
    },
    onError: (error) => {
      toastApiError(error, 'No se pudo crear el trabajador')
    },
  })
}

export function useUpdateTrabajadorMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateTrabajadorPayload }) =>
      trabajadoresService.actualizar(id, payload),
    onSuccess: () => {
      invalidateTrabajadores(queryClient)
      toastSuccess('Trabajador actualizado correctamente')
    },
    onError: (error) => {
      toastApiError(error, 'No se pudo actualizar el trabajador')
    },
  })
}

export function useDeleteTrabajadorMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, idUsuarioAuditoria }: { id: number; idUsuarioAuditoria: number }) =>
      trabajadoresService.eliminar(id, idUsuarioAuditoria),
    onSuccess: () => {
      invalidateTrabajadores(queryClient)
      toastSuccess('Trabajador dado de baja correctamente')
    },
    onError: (error) => {
      toastApiError(error, 'No se pudo dar de baja al trabajador')
    },
  })
}
