import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { lotesProtocoloQueryKeys } from '@/modules/balones/lotes-protocolo/constants/lotesProtocoloQueryKeys'
import { lotesProtocoloService } from '@/modules/balones/lotes-protocolo/services/lotes-protocolo.service'
import type {
  AplicarLoteProtocoloPayload,
  CreateLoteProtocoloPayload,
  UpdateLoteProtocoloPayload,
} from '@/modules/balones/lotes-protocolo/interfaces/lote-protocolo.interface'
import { balonesQueryKeys } from '@/modules/balones/cilindros/constants/balonesQueryKeys'
import { toastApiError, toastSuccess } from '@/shared/composables/useToast'

/**
 * Aplicar o editar una ficha cambia `id_lote_protocolo_vigente` del cilindro,
 * así que el detalle del balón también queda obsoleto.
 */
function invalidateLoteProtocoloRelated(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: lotesProtocoloQueryKeys.all })
  queryClient.invalidateQueries({ queryKey: balonesQueryKeys.all })
}

export function useCreateLoteProtocoloMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateLoteProtocoloPayload) => lotesProtocoloService.crear(payload),
    onSuccess: () => {
      invalidateLoteProtocoloRelated(queryClient)
      toastSuccess('Ficha de lote y protocolo registrada')
    },
    onError: (error) => {
      toastApiError(error, 'No se pudo registrar la ficha')
    },
  })
}

export function useUpdateLoteProtocoloMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateLoteProtocoloPayload }) =>
      lotesProtocoloService.actualizar(id, payload),
    onSuccess: (_data, variables) => {
      invalidateLoteProtocoloRelated(queryClient)
      queryClient.invalidateQueries({ queryKey: lotesProtocoloQueryKeys.detail(variables.id) })
      toastSuccess('Ficha actualizada')
    },
    onError: (error) => {
      toastApiError(error, 'No se pudo actualizar la ficha')
    },
  })
}

export function useAplicarLoteProtocoloMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: AplicarLoteProtocoloPayload }) =>
      lotesProtocoloService.aplicarABalones(id, payload),
    onSuccess: (data, variables) => {
      invalidateLoteProtocoloRelated(queryClient)
      queryClient.invalidateQueries({ queryKey: lotesProtocoloQueryKeys.detail(variables.id) })
      const total = data?.balonesAplicados ?? 0
      toastSuccess(
        total === 1
          ? 'Ficha aplicada a 1 cilindro'
          : `Ficha aplicada a ${total} cilindros`,
      )
    },
    onError: (error) => {
      toastApiError(error, 'No se pudo aplicar la ficha a los cilindros')
    },
  })
}

export function useDeleteLoteProtocoloMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, idUsuarioAuditoria }: { id: number; idUsuarioAuditoria: number }) =>
      lotesProtocoloService.eliminar(id, idUsuarioAuditoria),
    onSuccess: () => {
      invalidateLoteProtocoloRelated(queryClient)
      toastSuccess('Ficha eliminada')
    },
    onError: (error) => {
      toastApiError(error, 'No se pudo eliminar la ficha')
    },
  })
}
