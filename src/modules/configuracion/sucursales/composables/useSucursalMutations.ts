import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { sucursalesQueryKeys } from '@/modules/configuracion/sucursales/constants/sucursalesQueryKeys'
import { sucursalesService } from '@/modules/configuracion/sucursales/services/sucursales.service'
import type {
  CreateSucursalPayload,
  UpdateSucursalPayload,
} from '@/modules/configuracion/sucursales/interfaces/sucursal.interface'
import { toastApiError, toastSuccess } from '@/shared/composables/useToast'

export function useCreateSucursalMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateSucursalPayload) => sucursalesService.crear(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sucursalesQueryKeys.lists() })
      toastSuccess('Sucursal creada correctamente')
    },
    onError: (error) => {
      toastApiError(error, 'No se pudo crear la sucursal')
    },
  })
}

export function useUpdateSucursalMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateSucursalPayload }) =>
      sucursalesService.actualizar(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sucursalesQueryKeys.all })
      toastSuccess('Sucursal actualizada correctamente')
    },
    onError: (error) => {
      toastApiError(error, 'No se pudo actualizar la sucursal')
    },
  })
}

export function useDeleteSucursalMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => sucursalesService.eliminar(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sucursalesQueryKeys.lists() })
      toastSuccess('Sucursal eliminada correctamente')
    },
    onError: (error) => {
      toastApiError(error, 'No se pudo eliminar la sucursal')
    },
  })
}
