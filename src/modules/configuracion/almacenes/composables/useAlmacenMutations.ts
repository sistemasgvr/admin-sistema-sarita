import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { almacenesQueryKeys } from '@/modules/configuracion/almacenes/constants/almacenesQueryKeys'
import { almacenesService } from '@/modules/configuracion/almacenes/services/almacenes.service'
import type {
  CreateAlmacenPayload,
  UpdateAlmacenPayload,
} from '@/modules/configuracion/almacenes/interfaces/almacen.interface'
import { toastApiError, toastSuccess } from '@/shared/composables/useToast'

export function useCreateAlmacenMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateAlmacenPayload) => almacenesService.crear(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: almacenesQueryKeys.lists() })
      toastSuccess('Almacén creado correctamente')
    },
    onError: (error) => {
      toastApiError(error, 'No se pudo crear el almacén')
    },
  })
}

export function useUpdateAlmacenMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateAlmacenPayload }) =>
      almacenesService.actualizar(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: almacenesQueryKeys.all })
      toastSuccess('Almacén actualizado correctamente')
    },
    onError: (error) => {
      toastApiError(error, 'No se pudo actualizar el almacén')
    },
  })
}

export function useDeleteAlmacenMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => almacenesService.eliminar(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: almacenesQueryKeys.lists() })
      toastSuccess('Almacén eliminado correctamente')
    },
    onError: (error) => {
      toastApiError(error, 'No se pudo eliminar el almacén')
    },
  })
}
