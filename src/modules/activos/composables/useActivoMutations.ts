import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { activosQueryKeys } from '@/modules/activos/constants/activosQueryKeys'
import { activosService } from '@/modules/activos/services/activos.service'
import type {
  CreateActivoPayload,
  UpdateActivoPayload,
} from '@/modules/activos/interfaces/activo.interface'
import { toastApiError, toastSuccess } from '@/shared/composables/useToast'

function invalidateActivos(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: activosQueryKeys.all })
}

export function useCreateActivoMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateActivoPayload) => activosService.crear(payload),
    onSuccess: () => {
      invalidateActivos(queryClient)
      toastSuccess('Activo creado correctamente')
    },
    onError: (error) => toastApiError(error, 'No se pudo crear el activo'),
  })
}

export function useUpdateActivoMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateActivoPayload }) =>
      activosService.actualizar(id, payload),
    onSuccess: () => {
      invalidateActivos(queryClient)
      toastSuccess('Activo actualizado correctamente')
    },
    onError: (error) => toastApiError(error, 'No se pudo actualizar el activo'),
  })
}

export function useDeleteActivoMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, idUsuarioAuditoria }: { id: number; idUsuarioAuditoria: number }) =>
      activosService.eliminar(id, idUsuarioAuditoria),
    onSuccess: () => {
      invalidateActivos(queryClient)
      toastSuccess('Activo dado de baja correctamente')
    },
    onError: (error) => toastApiError(error, 'No se pudo dar de baja al activo'),
  })
}
