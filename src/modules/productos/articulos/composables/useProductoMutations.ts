import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { productosQueryKeys } from '@/modules/productos/articulos/constants/productosQueryKeys'
import { productosService } from '@/modules/productos/articulos/services/productos.service'
import type {
  CreateProductoPayload,
  UpdateProductoPayload,
} from '@/modules/productos/articulos/interfaces/producto.interface'
import { toastApiError, toastSuccess } from '@/shared/composables/useToast'

export function useCreateProductoMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateProductoPayload) => productosService.crear(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productosQueryKeys.lists() })
      toastSuccess('Producto creado correctamente')
    },
    onError: (error) => {
      toastApiError(error, 'No se pudo crear el producto')
    },
  })
}

export function useUpdateProductoMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateProductoPayload }) =>
      productosService.actualizar(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productosQueryKeys.all })
      toastSuccess('Producto actualizado correctamente')
    },
    onError: (error) => {
      toastApiError(error, 'No se pudo actualizar el producto')
    },
  })
}

export function useDeleteProductoMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => productosService.eliminar(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productosQueryKeys.lists() })
      toastSuccess('Producto eliminado correctamente')
    },
    onError: (error) => {
      toastApiError(error, 'No se pudo eliminar el producto')
    },
  })
}

export function useRestaurarProductoMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      idUsuarioAuditoria,
    }: {
      id: number
      idUsuarioAuditoria?: number
    }) => productosService.restaurar(id, idUsuarioAuditoria),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productosQueryKeys.all })
      toastSuccess('Producto restaurado correctamente')
    },
    onError: (error) => {
      toastApiError(error, 'No se pudo restaurar el producto')
    },
  })
}
