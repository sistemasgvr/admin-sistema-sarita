import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { contactosQueryKeys } from '@/modules/contactos/constants/contactosQueryKeys'
import { contactosService } from '@/modules/contactos/services/contactos.service'
import type {
  CreateContactoPayload,
  UpdateContactoPayload,
} from '@/modules/contactos/interfaces/contacto.interface'
import { toastApiError, toastSuccess } from '@/shared/composables/useToast'

export function useCreateContactoMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateContactoPayload) => contactosService.crear(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contactosQueryKeys.lists() })
      toastSuccess('Contacto creado correctamente')
    },
    onError: (error) => {
      toastApiError(error, 'No se pudo crear el contacto')
    },
  })
}

export function useUpdateContactoMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateContactoPayload }) =>
      contactosService.actualizar(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contactosQueryKeys.all })
      toastSuccess('Contacto actualizado correctamente')
    },
    onError: (error) => {
      toastApiError(error, 'No se pudo actualizar el contacto')
    },
  })
}

export function useDeleteContactoMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => contactosService.eliminar(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contactosQueryKeys.lists() })
      toastSuccess('Contacto eliminado correctamente')
    },
    onError: (error) => {
      toastApiError(error, 'No se pudo eliminar el contacto')
    },
  })
}
