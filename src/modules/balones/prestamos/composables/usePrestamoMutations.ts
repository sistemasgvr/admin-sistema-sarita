import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { prestamosQueryKeys } from '@/modules/balones/prestamos/constants/prestamosQueryKeys'
import { prestamosAntiguedadQueryKeys } from '@/modules/balones/prestamos/constants/prestamosAntiguedadQueryKeys'
import { balonesQueryKeys } from '@/modules/balones/cilindros/constants/balonesQueryKeys'
import { stockGasQueryKeys } from '@/modules/balones/stock-gas/constants/stockGasQueryKeys'
import { prestamosService } from '@/modules/balones/prestamos/services/prestamos.service'
import type {
  CreatePrestamoPayload,
  UpdatePrestamoPayload,
} from '@/modules/balones/prestamos/interfaces/prestamo.interface'
import { toastApiError, toastSuccess } from '@/shared/composables/useToast'

export function useCreatePrestamoMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreatePrestamoPayload) => prestamosService.crear(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: prestamosQueryKeys.all })
      toastSuccess('Préstamo registrado correctamente')
    },
    onError: (error) => {
      toastApiError(error, 'No se pudo registrar el préstamo')
    },
  })
}

export function useUpdatePrestamoMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdatePrestamoPayload }) =>
      prestamosService.actualizar(id, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: prestamosQueryKeys.all })
      queryClient.invalidateQueries({ queryKey: prestamosQueryKeys.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: prestamosAntiguedadQueryKeys.all })
      queryClient.invalidateQueries({ queryKey: balonesQueryKeys.all })
      queryClient.invalidateQueries({ queryKey: stockGasQueryKeys.all })
      toastSuccess('Préstamo actualizado correctamente')
    },
    onError: (error) => {
      toastApiError(error, 'No se pudo actualizar el préstamo')
    },
  })
}

export function useDeletePrestamoMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, idUsuarioAuditoria }: { id: number; idUsuarioAuditoria: number }) =>
      prestamosService.eliminar(id, idUsuarioAuditoria),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: prestamosQueryKeys.all })
      toastSuccess('Préstamo eliminado correctamente')
    },
    onError: (error) => {
      toastApiError(error, 'No se pudo eliminar el préstamo')
    },
  })
}
