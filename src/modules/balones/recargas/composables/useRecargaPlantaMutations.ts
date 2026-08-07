import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { recargasPlantaQueryKeys } from '@/modules/balones/recargas/constants/recargasPlantaQueryKeys'
import { recargasPlantaService } from '@/modules/balones/recargas/services/recargas-planta.service'
import type {
  CreateRecargaPlantaPayload,
  UpdateRecargaPlantaPayload,
} from '@/modules/balones/recargas/interfaces/recarga-planta.interface'
import { toastApiError, toastSuccess } from '@/shared/composables/useToast'

export function useCreateRecargaPlantaMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateRecargaPlantaPayload) => recargasPlantaService.crear(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: recargasPlantaQueryKeys.lists() })
      toastSuccess('Orden de recarga registrada')
    },
    onError: (error) => toastApiError(error, 'No se pudo registrar la orden'),
  })
}

export function useUpdateRecargaPlantaMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (vars: { id: number; payload: UpdateRecargaPlantaPayload }) =>
      recargasPlantaService.actualizar(vars.id, vars.payload),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: recargasPlantaQueryKeys.lists() })
      queryClient.invalidateQueries({ queryKey: recargasPlantaQueryKeys.detail(vars.id) })
      toastSuccess('Orden de recarga actualizada')
    },
    onError: (error) => toastApiError(error, 'No se pudo actualizar la orden'),
  })
}

export function useDeleteRecargaPlantaMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (vars: { id: number; idUsuarioAuditoria: number }) =>
      recargasPlantaService.eliminar(vars.id, vars.idUsuarioAuditoria),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: recargasPlantaQueryKeys.lists() })
      toastSuccess('Orden de recarga eliminada')
    },
    onError: (error) => toastApiError(error, 'No se pudo eliminar la orden'),
  })
}
