import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { balonesQueryKeys } from '@/modules/balones/cilindros/constants/balonesQueryKeys'
import { balonesService } from '@/modules/balones/cilindros/services/balones.service'
import type {
  CreateBalonPayload,
  DarBajaBalonPayload,
  RegistrarPhHistorialPayload,
  RestaurarBalonPayload,
  UpdateBalonPayload,
} from '@/modules/balones/cilindros/interfaces/balon.interface'
import { toastApiError, toastSuccess } from '@/shared/composables/useToast'

export function useCreateBalonMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateBalonPayload) => balonesService.crear(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: balonesQueryKeys.lists() })
      queryClient.invalidateQueries({ queryKey: ['tipos-balon'] })
      toastSuccess('Cilindro registrado correctamente')
    },
    onError: (error) => {
      toastApiError(error, 'No se pudo registrar el cilindro')
    },
  })
}

export function useUpdateBalonMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateBalonPayload }) =>
      balonesService.actualizar(id, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: balonesQueryKeys.all })
      queryClient.invalidateQueries({ queryKey: balonesQueryKeys.detail(variables.id) })
      toastSuccess('Cilindro actualizado correctamente')
    },
    onError: (error) => {
      toastApiError(error, 'No se pudo actualizar el cilindro')
    },
  })
}

export function useDeleteBalonMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, idUsuarioAuditoria }: { id: number; idUsuarioAuditoria: number }) =>
      balonesService.eliminar(id, idUsuarioAuditoria),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: balonesQueryKeys.lists() })
      queryClient.invalidateQueries({ queryKey: ['tipos-balon'] })
      toastSuccess('Cilindro eliminado correctamente')
    },
    onError: (error) => {
      toastApiError(error, 'No se pudo eliminar el cilindro')
    },
  })
}

export function useRegistrarPhHistorialMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number
      payload: RegistrarPhHistorialPayload
    }) => balonesService.registrarPhHistorial(id, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: balonesQueryKeys.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: balonesQueryKeys.phHistorial(variables.id) })
      queryClient.invalidateQueries({ queryKey: balonesQueryKeys.lists() })
      toastSuccess('Prueba hidrostática registrada correctamente')
    },
    onError: (error) => {
      toastApiError(error, 'No se pudo registrar la prueba hidrostática')
    },
  })
}

export function useDarBajaBalonMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: DarBajaBalonPayload }) =>
      balonesService.darBaja(id, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: balonesQueryKeys.all })
      queryClient.invalidateQueries({ queryKey: balonesQueryKeys.baja(variables.id) })
      queryClient.invalidateQueries({
        queryKey: balonesQueryKeys.estadoHistorial(variables.id),
      })
      queryClient.invalidateQueries({ queryKey: ['bajas-pendientes'] })
      toastSuccess('Solicitud de baja registrada. Un administrador debe aprobarla.')
    },
    onError: (error) => {
      toastApiError(error, 'No se pudo registrar la solicitud de baja')
    },
  })
}

export function useRestaurarBalonMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: RestaurarBalonPayload }) =>
      balonesService.restaurar(id, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: balonesQueryKeys.all })
      queryClient.invalidateQueries({ queryKey: balonesQueryKeys.detail(variables.id) })
      queryClient.invalidateQueries({
        queryKey: balonesQueryKeys.estadoHistorial(variables.id),
      })
      toastSuccess('Cilindro reactivado correctamente')
    },
    onError: (error) => {
      toastApiError(error, 'No se pudo reactivar el cilindro')
    },
  })
}
