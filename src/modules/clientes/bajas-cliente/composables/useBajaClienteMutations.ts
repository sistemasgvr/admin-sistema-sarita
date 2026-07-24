import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { clientesQueryKeys } from '@/modules/clientes/constants/clientesQueryKeys'
import { bajasClienteQueryKeys } from '@/modules/clientes/bajas-cliente/constants/bajasClienteQueryKeys'
import { bajasClienteService } from '@/modules/clientes/bajas-cliente/services/bajas-cliente.service'
import type {
  SolicitarBajaClientePayload,
  SolicitarReactivacionClientePayload,
  AprobarBajaClientePayload,
  RechazarBajaClientePayload,
} from '@/modules/clientes/bajas-cliente/interfaces/baja-cliente.interface'
import { toastApiError, toastSuccess } from '@/shared/composables/useToast'

export function useSolicitarBajaClienteMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: SolicitarBajaClientePayload) =>
      bajasClienteService.solicitar(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: clientesQueryKeys.lists() })
      queryClient.invalidateQueries({ queryKey: bajasClienteQueryKeys.lists() })
      toastSuccess('Solicitud de baja registrada. Un administrador debe aprobarla.')
    },
    onError: (error) => {
      toastApiError(error, 'No se pudo registrar la solicitud de baja')
    },
  })
}

export function useSolicitarReactivacionClienteMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: SolicitarReactivacionClientePayload) =>
      bajasClienteService.solicitarReactivacion(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: clientesQueryKeys.lists() })
      queryClient.invalidateQueries({ queryKey: bajasClienteQueryKeys.lists() })
      toastSuccess('Solicitud de reactivación registrada. Un administrador debe aprobarla.')
    },
    onError: (error) => {
      toastApiError(error, 'No se pudo registrar la solicitud de reactivación')
    },
  })
}

export function useAprobarBajaClienteMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: AprobarBajaClientePayload }) =>
      bajasClienteService.aprobar(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bajasClienteQueryKeys.lists() })
      queryClient.invalidateQueries({ queryKey: clientesQueryKeys.lists() })
      toastSuccess('Solicitud aprobada correctamente')
    },
    onError: (error) => {
      toastApiError(error, 'No se pudo aprobar la solicitud')
    },
  })
}

export function useRechazarBajaClienteMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: RechazarBajaClientePayload }) =>
      bajasClienteService.rechazar(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bajasClienteQueryKeys.lists() })
      queryClient.invalidateQueries({ queryKey: clientesQueryKeys.lists() })
      toastSuccess('Solicitud de baja rechazada')
    },
    onError: (error) => {
      toastApiError(error, 'No se pudo rechazar la solicitud de baja')
    },
  })
}
