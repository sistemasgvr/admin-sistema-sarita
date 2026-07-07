import {
  apiDelete,
  apiGetPaginated,
  apiPatch,
  apiPost,
} from '@/shared/api/apiClient'
import type {
  CreateProductoPayload,
  DeleteProductoResponse,
  Producto,
  ProductoListFilters,
  UpdateProductoPayload,
} from '@/modules/productos/articulos/interfaces/producto.interface'

export const productosService = {
  listar(filters: ProductoListFilters = {}) {
    return apiGetPaginated<Producto>('/productos', { params: filters })
  },

  crear(payload: CreateProductoPayload) {
    return apiPost<Producto>('/productos', payload)
  },

  actualizar(id: number, payload: UpdateProductoPayload) {
    return apiPatch<Producto>(`/productos/${id}`, payload)
  },

  eliminar(id: number) {
    return apiDelete<DeleteProductoResponse>(`/productos/${id}`, { data: {} })
  },
}
