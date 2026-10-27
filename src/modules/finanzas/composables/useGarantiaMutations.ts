import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { finanzasQueryKeys } from '@/modules/finanzas/constants/finanzasQueryKeys'
import { finanzasService } from '@/modules/finanzas/services/finanzas.service'
import type {
  ActualizarGarantiaPayload,
  CrearGarantiaPayload,
  ReembolsarGarantiaPayload,
} from '@/modules/finanzas/interfaces/garantia.interface'
import { toastApiError, toastSuccess, toastWarning } from '@/shared/composables/useToast'
import { invalidateCajaQueries } from '@/modules/caja/composables/useCajaQuery'

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
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: ActualizarGarantiaPayload }) =>
      finanzasService.actualizarGarantia(id, payload),
    onSuccess: (garantia) => {
      void queryClient.invalidateQueries({ queryKey: finanzasQueryKeys.garantias() })
      void invalidateCajaQueries(queryClient)
      toastSuccess('Garantía actualizada correctamente')
      for (const aviso of garantia?.avisos ?? []) toastWarning(aviso)
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
