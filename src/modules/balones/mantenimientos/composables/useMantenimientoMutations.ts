import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { mantenimientosQueryKeys } from '@/modules/balones/mantenimientos/constants/mantenimientosQueryKeys'
import { mantenimientosService } from '@/modules/balones/mantenimientos/services/mantenimientos.service'
import type {
  CreateMantenimientoPayload,
  UpdateMantenimientoPayload,
} from '@/modules/balones/mantenimientos/interfaces/mantenimiento.interface'
import { toastApiError, toastSuccess } from '@/shared/composables/useToast'

export function useCreateMantenimientoMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateMantenimientoPayload) => mantenimientosService.crear(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mantenimientosQueryKeys.lists() })
      toastSuccess('Mantenimiento registrado correctamente')
    },
    onError: (error) => {
      toastApiError(error, 'No se pudo registrar el mantenimiento')
    },
  })
}

export function useUpdateMantenimientoMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateMantenimientoPayload }) =>
      mantenimientosService.actualizar(id, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: mantenimientosQueryKeys.all })
      queryClient.invalidateQueries({
        queryKey: mantenimientosQueryKeys.detail(variables.id),
      })
      toastSuccess('Mantenimiento actualizado correctamente')
    },
    onError: (error) => {
      toastApiError(error, 'No se pudo actualizar el mantenimiento')
    },
  })
}

export function useDeleteMantenimientoMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, idUsuarioAuditoria }: { id: number; idUsuarioAuditoria: number }) =>
      mantenimientosService.eliminar(id, idUsuarioAuditoria),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mantenimientosQueryKeys.lists() })
      toastSuccess('Mantenimiento eliminado correctamente')
    },
    onError: (error) => {
      toastApiError(error, 'No se pudo eliminar el mantenimiento')
    },
  })
}
