import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { categoriasProductoQueryKeys } from '@/modules/productos/categorias/constants/categoriasProductoQueryKeys'
import { subCategoriasProductoQueryKeys } from '@/modules/productos/sub-categorias/constants/subCategoriasProductoQueryKeys'
import { subCategoriasProductoService } from '@/modules/productos/sub-categorias/services/sub-categorias-producto.service'
import type {
  CreateSubCategoriaProductoPayload,
  UpdateSubCategoriaProductoPayload,
} from '@/modules/productos/sub-categorias/interfaces/sub-categoria-producto.interface'
import { toastApiError, toastSuccess } from '@/shared/composables/useToast'

export function useCreateSubCategoriaProductoMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateSubCategoriaProductoPayload) =>
      subCategoriasProductoService.crear(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: subCategoriasProductoQueryKeys.lists() })
      queryClient.invalidateQueries({ queryKey: categoriasProductoQueryKeys.lists() })
      toastSuccess('Subcategoría creada correctamente')
    },
    onError: (error) => {
      toastApiError(error, 'No se pudo crear la subcategoría')
    },
  })
}

export function useUpdateSubCategoriaProductoMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateSubCategoriaProductoPayload }) =>
      subCategoriasProductoService.actualizar(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: subCategoriasProductoQueryKeys.all })
      toastSuccess('Subcategoría actualizada correctamente')
    },
    onError: (error) => {
      toastApiError(error, 'No se pudo actualizar la subcategoría')
    },
  })
}

export function useDeleteSubCategoriaProductoMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => subCategoriasProductoService.eliminar(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: subCategoriasProductoQueryKeys.lists() })
      queryClient.invalidateQueries({ queryKey: categoriasProductoQueryKeys.lists() })
      toastSuccess('Subcategoría eliminada correctamente')
    },
    onError: (error) => {
      toastApiError(error, 'No se pudo eliminar la subcategoría')
    },
  })
}
