import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { condicionesPagoQueryKeys } from '@/modules/configuracion/condiciones-pago/constants/condicionesPagoQueryKeys'
import { condicionesPagoService } from '@/modules/configuracion/condiciones-pago/services/condiciones-pago.service'
import type {
  CreateCondicionPagoPayload,
  UpdateCondicionPagoPayload,
} from '@/modules/configuracion/condiciones-pago/interfaces/condicion-pago.interface'
import { toastApiError, toastSuccess } from '@/shared/composables/useToast'

export function useCreateCondicionPagoMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateCondicionPagoPayload) => condicionesPagoService.crear(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: condicionesPagoQueryKeys.lists() })
      toastSuccess('Condición de pago creada correctamente')
    },
    onError: (error) => {
      toastApiError(error, 'No se pudo crear la condición de pago')
    },
  })
}

export function useUpdateCondicionPagoMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateCondicionPagoPayload }) =>
      condicionesPagoService.actualizar(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: condicionesPagoQueryKeys.all })
      toastSuccess('Condición de pago actualizada correctamente')
    },
    onError: (error) => {
      toastApiError(error, 'No se pudo actualizar la condición de pago')
    },
  })
}

export function useDeleteCondicionPagoMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => condicionesPagoService.eliminar(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: condicionesPagoQueryKeys.lists() })
      toastSuccess('Condición de pago eliminada correctamente')
    },
    onError: (error) => {
      toastApiError(error, 'No se pudo eliminar la condición de pago')
    },
  })
}
