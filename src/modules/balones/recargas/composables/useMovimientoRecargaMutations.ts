import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { balonesQueryKeys } from '@/modules/balones/cilindros/constants/balonesQueryKeys'
import { movimientosRecargaQueryKeys } from '@/modules/balones/recargas/constants/movimientosRecargaQueryKeys'
import { movimientosRecargaService } from '@/modules/balones/recargas/services/movimientos-recarga.service'
import type {
  CreateMovimientoRecargaPayload,
  UpdateMovimientoRecargaPayload,
} from '@/modules/balones/recargas/interfaces/movimiento-recarga.interface'
import { toastApiError, toastSuccess } from '@/shared/composables/useToast'

export function useCreateMovimientoRecargaMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateMovimientoRecargaPayload) =>
      movimientosRecargaService.crear(payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: movimientosRecargaQueryKeys.lists() })
      queryClient.invalidateQueries({ queryKey: balonesQueryKeys.lists() })
      if (variables.idBalon) {
        queryClient.invalidateQueries({ queryKey: balonesQueryKeys.detail(variables.idBalon) })
        queryClient.invalidateQueries({ queryKey: balonesQueryKeys.phHistorial(variables.idBalon) })
      }
      toastSuccess('Recarga registrada correctamente')
    },
    onError: (error) => {
      toastApiError(error, 'No se pudo registrar la recarga')
    },
  })
}

export function useUpdateMovimientoRecargaMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateMovimientoRecargaPayload }) =>
      movimientosRecargaService.actualizar(id, payload),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: movimientosRecargaQueryKeys.all })
      queryClient.invalidateQueries({
        queryKey: movimientosRecargaQueryKeys.detail(variables.id),
      })
      queryClient.invalidateQueries({ queryKey: balonesQueryKeys.lists() })
      const idBalon = data?.id_balon
      if (idBalon) {
        queryClient.invalidateQueries({ queryKey: balonesQueryKeys.detail(idBalon) })
        queryClient.invalidateQueries({ queryKey: balonesQueryKeys.phHistorial(idBalon) })
      }
      toastSuccess('Recarga actualizada correctamente')
    },
    onError: (error) => {
      toastApiError(error, 'No se pudo actualizar la recarga')
    },
  })
}

export function useDeleteMovimientoRecargaMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, idUsuarioAuditoria }: { id: number; idUsuarioAuditoria: number }) =>
      movimientosRecargaService.eliminar(id, idUsuarioAuditoria),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: movimientosRecargaQueryKeys.lists() })
      toastSuccess('Recarga eliminada correctamente')
    },
    onError: (error) => {
      toastApiError(error, 'No se pudo eliminar la recarga')
    },
  })
}
