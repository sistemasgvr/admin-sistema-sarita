import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { productoImagenesQueryKeys } from '@/modules/productos/articulos/constants/productoImagenesQueryKeys'
import { productoImagenesService } from '@/modules/productos/articulos/services/producto-imagenes.service'
import type {
  CreateProductoImagenMeta,
  UpdateProductoImagenPayload,
} from '@/modules/productos/articulos/interfaces/producto-imagen.interface'
import { toastApiError, toastSuccess } from '@/shared/composables/useToast'

function invalidateImagenes(queryClient: ReturnType<typeof useQueryClient>, idProducto?: number) {
  if (idProducto) {
    queryClient.invalidateQueries({
      queryKey: productoImagenesQueryKeys.list(idProducto),
    })
  } else {
    queryClient.invalidateQueries({ queryKey: productoImagenesQueryKeys.all })
  }
}

export function useUploadProductoImagenMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      idProducto,
      file,
      meta,
    }: {
      idProducto: number
      file: File
      meta?: CreateProductoImagenMeta
    }) => productoImagenesService.crear(idProducto, file, meta),
    onSuccess: (_data, variables) => {
      invalidateImagenes(queryClient, variables.idProducto)
      toastSuccess('Imagen subida correctamente')
    },
    onError: (error) => {
      toastApiError(error, 'No se pudo subir la imagen')
    },
  })
}

export function useUpdateProductoImagenMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number
      payload: UpdateProductoImagenPayload
      idProducto?: number
    }) => productoImagenesService.actualizar(id, payload),
    onSuccess: (_data, variables) => {
      invalidateImagenes(queryClient, variables.idProducto)
      toastSuccess('Imagen actualizada')
    },
    onError: (error) => {
      toastApiError(error, 'No se pudo actualizar la imagen')
    },
  })
}

export function useReplaceProductoImagenMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      file,
    }: {
      id: number
      file: File
      idProducto?: number
    }) => productoImagenesService.reemplazarArchivo(id, file),
    onSuccess: (_data, variables) => {
      invalidateImagenes(queryClient, variables.idProducto)
      toastSuccess('Archivo reemplazado')
    },
    onError: (error) => {
      toastApiError(error, 'No se pudo reemplazar la imagen')
    },
  })
}

export function useDeleteProductoImagenMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id }: { id: number; idProducto?: number }) =>
      productoImagenesService.eliminar(id),
    onSuccess: (_data, variables) => {
      invalidateImagenes(queryClient, variables.idProducto)
      toastSuccess('Imagen eliminada')
    },
    onError: (error) => {
      toastApiError(error, 'No se pudo eliminar la imagen')
    },
  })
}
