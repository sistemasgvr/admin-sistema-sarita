import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { usuariosQueryKeys } from '@/modules/usuarios/constants/usuariosQueryKeys'
import { usuariosService } from '@/modules/usuarios/services/usuarios.service'
import type {
  CreateUsuarioPayload,
  UpdateUsuarioPayload,
} from '@/modules/usuarios/interfaces/usuario.interface'
import { toastApiError, toastSuccess } from '@/shared/composables/useToast'

export function useCreateUsuarioMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateUsuarioPayload) => usuariosService.crear(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: usuariosQueryKeys.lists() })
      toastSuccess('Usuario creado correctamente')
    },
    onError: (error) => {
      toastApiError(error, 'No se pudo crear el usuario')
    },
  })
}

export function useUpdateUsuarioMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateUsuarioPayload }) =>
      usuariosService.actualizar(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: usuariosQueryKeys.all })
      toastSuccess('Usuario actualizado correctamente')
    },
    onError: (error) => {
      toastApiError(error, 'No se pudo actualizar el usuario')
    },
  })
}

export function useDesactivarUsuarioMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => usuariosService.desactivar(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: usuariosQueryKeys.lists() })
      toastSuccess('Usuario desactivado correctamente')
    },
    onError: (error) => {
      toastApiError(error, 'No se pudo desactivar el usuario')
    },
  })
}

export function useActivarUsuarioMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => usuariosService.activar(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: usuariosQueryKeys.lists() })
      toastSuccess('Usuario activado correctamente')
    },
    onError: (error) => {
      toastApiError(error, 'No se pudo activar el usuario')
    },
  })
}
