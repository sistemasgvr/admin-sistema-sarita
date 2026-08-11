import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { recojosQueryKeys } from '@/modules/balones/recojos/constants/recojosQueryKeys'
import { recojosService } from '@/modules/balones/recojos/services/recojos.service'
import type {
  CreateRecojoPayload,
  RegistrarResultadoRecojoPayload,
  UpdateRecojoPayload,
} from '@/modules/balones/recojos/interfaces/recojo.interface'
import { prestamosQueryKeys } from '@/modules/balones/prestamos/constants/prestamosQueryKeys'
import { prestamosDetalleQueryKeys } from '@/modules/balones/prestamos/constants/prestamosDetalleQueryKeys'
import { toastApiError, toastSuccess } from '@/shared/composables/useToast'

function invalidateRecojoRelated(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: recojosQueryKeys.all })
  queryClient.invalidateQueries({ queryKey: prestamosQueryKeys.all })
  queryClient.invalidateQueries({ queryKey: prestamosDetalleQueryKeys.all })
}

export function useCreateRecojoMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateRecojoPayload) => recojosService.crear(payload),
    onSuccess: () => {
      invalidateRecojoRelated(queryClient)
      toastSuccess('Recojo programado correctamente')
    },
    onError: (error) => {
      toastApiError(error, 'No se pudo programar el recojo')
    },
  })
}

export function useUpdateRecojoMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateRecojoPayload }) =>
      recojosService.actualizar(id, payload),
    onSuccess: (_data, variables) => {
      invalidateRecojoRelated(queryClient)
      queryClient.invalidateQueries({ queryKey: recojosQueryKeys.detail(variables.id) })
      toastSuccess('Recojo actualizado')
    },
    onError: (error) => {
      toastApiError(error, 'No se pudo actualizar el recojo')
    },
  })
}

export function useRegistrarResultadoRecojoMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number
      payload: RegistrarResultadoRecojoPayload
    }) => recojosService.registrarResultado(id, payload),
    onSuccess: (_data, variables) => {
      invalidateRecojoRelated(queryClient)
      queryClient.invalidateQueries({ queryKey: recojosQueryKeys.detail(variables.id) })
      toastSuccess('Resultado de recojo registrado')
    },
    onError: (error) => {
      toastApiError(error, 'No se pudo registrar el resultado del recojo')
    },
  })
}

export function useDeleteRecojoMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, idUsuarioAuditoria }: { id: number; idUsuarioAuditoria: number }) =>
      recojosService.eliminar(id, idUsuarioAuditoria),
    onSuccess: () => {
      invalidateRecojoRelated(queryClient)
      toastSuccess('Recojo eliminado')
    },
    onError: (error) => {
      toastApiError(error, 'No se pudo eliminar el recojo')
    },
  })
}
