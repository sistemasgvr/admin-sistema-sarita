import {
  apiDelete,
  apiGet,
  apiGetPaginated,
  apiPatch,
  apiPost,
  apiPut,
} from '@/shared/api/apiClient'
import type {
  CreateProductoImagenMeta,
  DeleteProductoImagenResponse,
  ProductoImagen,
  ProductoImagenListFilters,
  UpdateProductoImagenPayload,
} from '@/modules/productos/articulos/interfaces/producto-imagen.interface'

export const productoImagenesService = {
  listar(idProducto: number, filters: ProductoImagenListFilters = {}) {
    return apiGetPaginated<ProductoImagen>(`/productos/${idProducto}/imagenes`, {
      params: {
        pagina: filters.pagina ?? 1,
        limite: filters.limite ?? 50,
      },
    })
  },

  obtener(id: number) {
    return apiGet<ProductoImagen>(`/producto-imagenes/${id}`)
  },

  crear(idProducto: number, file: File, meta: CreateProductoImagenMeta = {}) {
    const body = new FormData()
    body.append('file', file)
    if (meta.orden != null) body.append('orden', String(meta.orden))
    if (meta.esPrincipal != null) body.append('esPrincipal', String(meta.esPrincipal))
    if (meta.idUsuarioAuditoria != null) {
      body.append('idUsuarioAuditoria', String(meta.idUsuarioAuditoria))
    }
    return apiPost<ProductoImagen>(`/productos/${idProducto}/imagenes`, body)
  },

  actualizar(id: number, payload: UpdateProductoImagenPayload) {
    return apiPatch<ProductoImagen>(`/producto-imagenes/${id}`, payload)
  },

  reemplazarArchivo(id: number, file: File, idUsuarioAuditoria?: number) {
    const body = new FormData()
    body.append('file', file)
    if (idUsuarioAuditoria != null) {
      body.append('idUsuarioAuditoria', String(idUsuarioAuditoria))
    }
    return apiPut<ProductoImagen>(`/producto-imagenes/${id}/archivo`, body)
  },

  eliminar(id: number, idUsuarioAuditoria?: number) {
    return apiDelete<DeleteProductoImagenResponse>(`/producto-imagenes/${id}`, {
      data: idUsuarioAuditoria != null ? { idUsuarioAuditoria } : {},
    })
  },
}
