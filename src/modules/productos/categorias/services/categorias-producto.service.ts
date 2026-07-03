import {
  apiDelete,
  apiGetPaginated,
  apiPatch,
  apiPost,
} from '@/shared/api/apiClient'
import type {
  CategoriaProducto,
  CategoriaProductoListFilters,
  CreateCategoriaProductoPayload,
  DeleteCategoriaProductoResponse,
  UpdateCategoriaProductoPayload,
} from '@/modules/productos/categorias/interfaces/categoria-producto.interface'

export const categoriasProductoService = {
  listar(filters: CategoriaProductoListFilters = {}) {
    return apiGetPaginated<CategoriaProducto>('/productos/categorias', { params: filters })
  },

  crear(payload: CreateCategoriaProductoPayload) {
    return apiPost<CategoriaProducto>('/productos/categorias', payload)
  },

  actualizar(id: number, payload: UpdateCategoriaProductoPayload) {
    return apiPatch<CategoriaProducto>(`/productos/categorias/${id}`, payload)
  },

  eliminar(id: number) {
    return apiDelete<DeleteCategoriaProductoResponse>(`/productos/categorias/${id}`, { data: {} })
  },
}
