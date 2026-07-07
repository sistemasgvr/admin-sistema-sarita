import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { catalogoPreciosQueryKeys } from '@/modules/productos/catalogo-precios/constants/catalogoPreciosQueryKeys'
import { catalogoPreciosService } from '@/modules/productos/catalogo-precios/services/catalogo-precios.service'
import type {
  CreateCatalogoPrecioPayload,
  UpdateCatalogoPrecioPayload,
} from '@/modules/productos/catalogo-precios/interfaces/catalogo-precio.interface'
import { toastApiError, toastSuccess } from '@/shared/composables/useToast'

export function useCreateCatalogoPrecioMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateCatalogoPrecioPayload) => catalogoPreciosService.crear(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: catalogoPreciosQueryKeys.lists() })
      toastSuccess('Ítem de catálogo creado correctamente')
    },
    onError: (error) => {
      toastApiError(error, 'No se pudo crear el ítem de catálogo')
    },
  })
}

export function useUpdateCatalogoPrecioMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateCatalogoPrecioPayload }) =>
      catalogoPreciosService.actualizar(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: catalogoPreciosQueryKeys.all })
      toastSuccess('Ítem de catálogo actualizado correctamente')
    },
    onError: (error) => {
      toastApiError(error, 'No se pudo actualizar el ítem de catálogo')
    },
  })
}

export function useDeleteCatalogoPrecioMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => catalogoPreciosService.eliminar(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: catalogoPreciosQueryKeys.lists() })
      toastSuccess('Ítem de catálogo eliminado correctamente')
    },
    onError: (error) => {
      toastApiError(error, 'No se pudo eliminar el ítem de catálogo')
    },
  })
}
