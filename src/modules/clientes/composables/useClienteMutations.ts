import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { clientesQueryKeys } from '@/modules/clientes/constants/clientesQueryKeys'
import { clientesService } from '@/modules/clientes/services/clientes.service'
import type {
  CreateClientePayload,
  UpdateClientePayload,
} from '@/modules/clientes/interfaces/cliente.interface'
import { toastApiError, toastSuccess } from '@/shared/composables/useToast'

export function useCreateClienteMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateClientePayload) => clientesService.crear(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: clientesQueryKeys.lists() })
      toastSuccess('Cliente creado correctamente')
    },
    onError: (error) => {
      toastApiError(error, 'No se pudo crear el cliente')
    },
  })
}

export function useUpdateClienteMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateClientePayload }) =>
      clientesService.actualizar(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: clientesQueryKeys.all })
      toastSuccess('Cliente actualizado correctamente')
    },
    onError: (error) => {
      toastApiError(error, 'No se pudo actualizar el cliente')
    },
  })
}

export function useDeleteClienteMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, idUsuarioAuditoria }: { id: number; idUsuarioAuditoria: number }) =>
      clientesService.eliminar(id, idUsuarioAuditoria),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: clientesQueryKeys.lists() })
      toastSuccess('Cliente eliminado correctamente')
    },
    onError: (error) => {
      toastApiError(error, 'No se pudo eliminar el cliente')
    },
  })
}

export function useRestaurarClienteMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, idUsuarioAuditoria }: { id: number; idUsuarioAuditoria: number }) =>
      clientesService.restaurar(id, idUsuarioAuditoria),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: clientesQueryKeys.lists() })
      toastSuccess('Cliente restaurado correctamente')
    },
    onError: (error) => {
      toastApiError(error, 'No se pudo restaurar el cliente')
    },
  })
}
