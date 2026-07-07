import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { categoriasProductoQueryKeys } from '@/modules/productos/categorias/constants/categoriasProductoQueryKeys'
import { categoriasProductoService } from '@/modules/productos/categorias/services/categorias-producto.service'
import type {
  CreateCategoriaProductoPayload,
  UpdateCategoriaProductoPayload,
} from '@/modules/productos/categorias/interfaces/categoria-producto.interface'
import { toastApiError, toastSuccess } from '@/shared/composables/useToast'

export function useCreateCategoriaProductoMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateCategoriaProductoPayload) =>
      categoriasProductoService.crear(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoriasProductoQueryKeys.lists() })
      toastSuccess('Categoría creada correctamente')
    },
    onError: (error) => {
      toastApiError(error, 'No se pudo crear la categoría')
    },
  })
}

export function useUpdateCategoriaProductoMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateCategoriaProductoPayload }) =>
      categoriasProductoService.actualizar(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoriasProductoQueryKeys.all })
      toastSuccess('Categoría actualizada correctamente')
    },
    onError: (error) => {
      toastApiError(error, 'No se pudo actualizar la categoría')
    },
  })
}

export function useDeleteCategoriaProductoMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => categoriasProductoService.eliminar(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoriasProductoQueryKeys.lists() })
      toastSuccess('Categoría eliminada correctamente')
    },
    onError: (error) => {
      toastApiError(error, 'No se pudo eliminar la categoría')
    },
  })
}
