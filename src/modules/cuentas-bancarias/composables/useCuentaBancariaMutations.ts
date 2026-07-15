import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { cuentasBancariasQueryKeys } from '@/modules/cuentas-bancarias/constants/cuentasBancariasQueryKeys'
import { cuentasBancariasService } from '@/modules/cuentas-bancarias/services/cuentas-bancarias.service'
import type {
  CreateCuentaBancariaPayload,
  UpdateCuentaBancariaPayload,
} from '@/modules/cuentas-bancarias/interfaces/cuenta-bancaria.interface'
import { toastApiError, toastSuccess } from '@/shared/composables/useToast'

export function useCreateCuentaBancariaMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateCuentaBancariaPayload) => cuentasBancariasService.crear(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cuentasBancariasQueryKeys.lists() })
      toastSuccess('Cuenta bancaria creada correctamente')
    },
    onError: (error) => {
      toastApiError(error, 'No se pudo crear la cuenta bancaria')
    },
  })
}

export function useUpdateCuentaBancariaMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateCuentaBancariaPayload }) =>
      cuentasBancariasService.actualizar(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cuentasBancariasQueryKeys.all })
      toastSuccess('Cuenta bancaria actualizada correctamente')
    },
    onError: (error) => {
      toastApiError(error, 'No se pudo actualizar la cuenta bancaria')
    },
  })
}

export function useDeleteCuentaBancariaMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, idUsuarioAuditoria }: { id: number; idUsuarioAuditoria: number }) =>
      cuentasBancariasService.eliminar(id, idUsuarioAuditoria),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cuentasBancariasQueryKeys.lists() })
      toastSuccess('Cuenta bancaria eliminada correctamente')
    },
    onError: (error) => {
      toastApiError(error, 'No se pudo eliminar la cuenta bancaria')
    },
  })
}
