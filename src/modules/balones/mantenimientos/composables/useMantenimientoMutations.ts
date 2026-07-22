import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { balonesQueryKeys } from '@/modules/balones/cilindros/constants/balonesQueryKeys'
import { mantenimientosQueryKeys } from '@/modules/balones/mantenimientos/constants/mantenimientosQueryKeys'
import { mantenimientosService } from '@/modules/balones/mantenimientos/services/mantenimientos.service'
import type {
  CreateMantenimientoPayload,
  FinalizarMantenimientoPayload,
  UpdateMantenimientoPayload,
} from '@/modules/balones/mantenimientos/interfaces/mantenimiento.interface'
import { toastApiError, toastSuccess } from '@/shared/composables/useToast'

export function useCreateMantenimientoMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateMantenimientoPayload) => mantenimientosService.crear(payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: mantenimientosQueryKeys.lists() })
      queryClient.invalidateQueries({ queryKey: balonesQueryKeys.lists() })
      if (variables.idBalon) {
        queryClient.invalidateQueries({ queryKey: balonesQueryKeys.detail(variables.idBalon) })
        queryClient.invalidateQueries({ queryKey: balonesQueryKeys.phHistorial(variables.idBalon) })
      }
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
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: mantenimientosQueryKeys.all })
      queryClient.invalidateQueries({
        queryKey: mantenimientosQueryKeys.detail(variables.id),
      })
      queryClient.invalidateQueries({ queryKey: balonesQueryKeys.lists() })
      const idBalon = data?.id_balon
      if (idBalon) {
        queryClient.invalidateQueries({ queryKey: balonesQueryKeys.detail(idBalon) })
        queryClient.invalidateQueries({ queryKey: balonesQueryKeys.phHistorial(idBalon) })
      }
      toastSuccess('Mantenimiento actualizado correctamente')
    },
    onError: (error) => {
      toastApiError(error, 'No se pudo actualizar el mantenimiento')
    },
  })
}

export function useFinalizarMantenimientoMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: FinalizarMantenimientoPayload }) =>
      mantenimientosService.finalizar(id, payload),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: mantenimientosQueryKeys.all })
      queryClient.invalidateQueries({
        queryKey: mantenimientosQueryKeys.detail(variables.id),
      })
      queryClient.invalidateQueries({ queryKey: balonesQueryKeys.lists() })
      const idBalon = data?.id_balon
      if (idBalon) {
        queryClient.invalidateQueries({ queryKey: balonesQueryKeys.detail(idBalon) })
        queryClient.invalidateQueries({ queryKey: balonesQueryKeys.phHistorial(idBalon) })
      }
      toastSuccess(
        data?.nombre_propietario?.toUpperCase() === 'CLIENTE' || data?.id_cliente_ubicacion != null
          ? 'Mantenimiento finalizado: cilindro entregado al cliente'
          : 'Mantenimiento finalizado: cilindro reingresado a almacén',
      )
    },
    onError: (error) => {
      toastApiError(error, 'No se pudo finalizar el mantenimiento')
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
