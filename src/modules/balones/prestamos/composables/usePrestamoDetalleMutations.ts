import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { prestamosAntiguedadQueryKeys } from '@/modules/balones/prestamos/constants/prestamosAntiguedadQueryKeys'
import { prestamosDetalleQueryKeys } from '@/modules/balones/prestamos/constants/prestamosDetalleQueryKeys'
import { prestamosQueryKeys } from '@/modules/balones/prestamos/constants/prestamosQueryKeys'
import { balonesQueryKeys } from '@/modules/balones/cilindros/constants/balonesQueryKeys'
import { stockGasQueryKeys } from '@/modules/balones/stock-gas/constants/stockGasQueryKeys'
import { prestamosDetalleService } from '@/modules/balones/prestamos/services/prestamos-detalle.service'
import type {
  CreatePrestamoDetallePayload,
  DevolverPrestamoDetallePayload,
  UpdatePrestamoDetallePayload,
} from '@/modules/balones/prestamos/interfaces/prestamo-detalle.interface'
import { toastApiError, toastSuccess } from '@/shared/composables/useToast'

function invalidatePrestamoImpacto(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: prestamosDetalleQueryKeys.all })
  queryClient.invalidateQueries({ queryKey: prestamosQueryKeys.all })
  queryClient.invalidateQueries({ queryKey: prestamosAntiguedadQueryKeys.all })
  queryClient.invalidateQueries({ queryKey: balonesQueryKeys.all })
  queryClient.invalidateQueries({ queryKey: stockGasQueryKeys.all })
}

export function useCreatePrestamoDetalleMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreatePrestamoDetallePayload) =>
      prestamosDetalleService.crear(payload),
    onSuccess: (_data, variables) => {
      invalidatePrestamoImpacto(queryClient)
      queryClient.invalidateQueries({
        queryKey: prestamosQueryKeys.detail(variables.idPrestamo),
      })
      toastSuccess('Cilindro agregado al préstamo')
    },
    onError: (error) => {
      toastApiError(error, 'No se pudo agregar el cilindro')
    },
  })
}

export function useUpdatePrestamoDetalleMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdatePrestamoDetallePayload }) =>
      prestamosDetalleService.actualizar(id, payload),
    onSuccess: (_data, variables) => {
      invalidatePrestamoImpacto(queryClient)
      queryClient.invalidateQueries({
        queryKey: prestamosDetalleQueryKeys.detail(variables.id),
      })
      toastSuccess('Detalle actualizado correctamente')
    },
    onError: (error) => {
      toastApiError(error, 'No se pudo actualizar el detalle')
    },
  })
}

export function useDevolverPrestamoDetalleMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: DevolverPrestamoDetallePayload }) =>
      prestamosDetalleService.devolver(id, payload),
    onSuccess: () => {
      invalidatePrestamoImpacto(queryClient)
      toastSuccess('Devolución / reingreso registrado')
    },
    onError: (error) => {
      toastApiError(error, 'No se pudo registrar la devolución')
    },
  })
}

export function useDeletePrestamoDetalleMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, idUsuarioAuditoria }: { id: number; idUsuarioAuditoria: number }) =>
      prestamosDetalleService.eliminar(id, idUsuarioAuditoria),
    onSuccess: () => {
      invalidatePrestamoImpacto(queryClient)
      toastSuccess('Cilindro eliminado del préstamo')
    },
    onError: (error) => {
      toastApiError(error, 'No se pudo eliminar el cilindro')
    },
  })
}
