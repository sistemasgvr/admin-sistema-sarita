import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { vehiculosQueryKeys } from '@/modules/vehiculos/constants/vehiculosQueryKeys'
import { vehiculosService } from '@/modules/vehiculos/services/vehiculos.service'
import type {
  CreateVehiculoPayload,
  UpdateVehiculoPayload,
} from '@/modules/vehiculos/interfaces/vehiculo.interface'
import { toastApiError, toastSuccess } from '@/shared/composables/useToast'

export function useCreateVehiculoMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateVehiculoPayload) => vehiculosService.crear(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: vehiculosQueryKeys.lists() })
      toastSuccess('Vehículo creado correctamente')
    },
    onError: (error) => {
      toastApiError(error, 'No se pudo crear el vehículo')
    },
  })
}

export function useUpdateVehiculoMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateVehiculoPayload }) =>
      vehiculosService.actualizar(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: vehiculosQueryKeys.all })
      toastSuccess('Vehículo actualizado correctamente')
    },
    onError: (error) => {
      toastApiError(error, 'No se pudo actualizar el vehículo')
    },
  })
}

export function useDeleteVehiculoMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, idUsuarioAuditoria }: { id: number; idUsuarioAuditoria: number }) =>
      vehiculosService.eliminar(id, idUsuarioAuditoria),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: vehiculosQueryKeys.lists() })
      toastSuccess('Vehículo eliminado correctamente')
    },
    onError: (error) => {
      toastApiError(error, 'No se pudo eliminar el vehículo')
    },
  })
}
