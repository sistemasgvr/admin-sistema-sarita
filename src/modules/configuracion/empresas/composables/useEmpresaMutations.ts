import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { empresasQueryKeys } from '@/modules/configuracion/empresas/constants/empresasQueryKeys'
import { empresasService } from '@/modules/configuracion/empresas/services/empresas.service'
import type {
  CreateEmpresaPayload,
  UpdateEmpresaPayload,
} from '@/modules/configuracion/empresas/interfaces/empresa.interface'
import { toastApiError, toastSuccess } from '@/shared/composables/useToast'

export function useCreateEmpresaMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateEmpresaPayload) => empresasService.crear(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: empresasQueryKeys.lists() })
      toastSuccess('Configuración de empresa guardada')
    },
    onError: (error) => {
      toastApiError(error, 'No se pudo crear la empresa')
    },
  })
}

export function useUpdateEmpresaMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateEmpresaPayload }) =>
      empresasService.actualizar(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: empresasQueryKeys.all })
      toastSuccess('Configuración de empresa actualizada')
    },
    onError: (error) => {
      toastApiError(error, 'No se pudo actualizar la empresa')
    },
  })
}

export function useDeleteEmpresaMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => empresasService.eliminar(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: empresasQueryKeys.lists() })
      toastSuccess('Empresa eliminada correctamente')
    },
    onError: (error) => {
      toastApiError(error, 'No se pudo eliminar la empresa')
    },
  })
}
