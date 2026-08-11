import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { finanzasQueryKeys } from '@/modules/finanzas/constants/finanzasQueryKeys'
import { finanzasService } from '@/modules/finanzas/services/finanzas.service'
import type {
  ActualizarGarantiaPayload,
  CrearGarantiaPayload,
  ReembolsarGarantiaPayload,
} from '@/modules/finanzas/interfaces/garantia.interface'
import { toastApiError, toastSuccess } from '@/shared/composables/useToast'

function useInvalidate() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: finanzasQueryKeys.garantias() })
}

export function useCrearGarantiaMutation() {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: (payload: CrearGarantiaPayload) => finanzasService.crearGarantia(payload),
    onSuccess: () => {
      invalidate()
      toastSuccess('Garantía registrada correctamente')
    },
    onError: (error) => toastApiError(error, 'No se pudo registrar la garantía'),
  })
}

export function useActualizarGarantiaMutation() {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: ActualizarGarantiaPayload }) =>
      finanzasService.actualizarGarantia(id, payload),
    onSuccess: () => {
      invalidate()
      toastSuccess('Garantía actualizada correctamente')
    },
    onError: (error) => toastApiError(error, 'No se pudo actualizar la garantía'),
  })
}

export function useReembolsarGarantiaMutation() {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: ReembolsarGarantiaPayload }) =>
      finanzasService.reembolsarGarantia(id, payload),
    onSuccess: () => {
      invalidate()
      toastSuccess('Devolución de garantía registrada')
    },
    onError: (error) => toastApiError(error, 'No se pudo registrar la devolución'),
  })
}

export function useEliminarGarantiaMutation() {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: ({ id, idUsuarioAuditoria }: { id: number; idUsuarioAuditoria?: number }) =>
      finanzasService.eliminarGarantia(id, idUsuarioAuditoria),
    onSuccess: () => {
      invalidate()
      toastSuccess('Garantía eliminada correctamente')
    },
    onError: (error) => toastApiError(error, 'No se pudo eliminar la garantía'),
  })
}
