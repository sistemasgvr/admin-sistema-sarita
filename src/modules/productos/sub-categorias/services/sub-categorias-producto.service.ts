import {
  apiDelete,
  apiGetPaginated,
  apiPatch,
  apiPost,
} from '@/shared/api/apiClient'
import type {
  CreateSubCategoriaProductoPayload,
  DeleteSubCategoriaProductoResponse,
  SubCategoriaProducto,
  SubCategoriaProductoListFilters,
  UpdateSubCategoriaProductoPayload,
} from '@/modules/productos/sub-categorias/interfaces/sub-categoria-producto.interface'

export const subCategoriasProductoService = {
  listar(filters: SubCategoriaProductoListFilters = {}) {
    return apiGetPaginated<SubCategoriaProducto>('/productos/sub-categorias', { params: filters })
  },

  crear(payload: CreateSubCategoriaProductoPayload) {
    return apiPost<SubCategoriaProducto>('/productos/sub-categorias', payload)
  },

  actualizar(id: number, payload: UpdateSubCategoriaProductoPayload) {
    return apiPatch<SubCategoriaProducto>(`/productos/sub-categorias/${id}`, payload)
  },

  eliminar(id: number) {
    return apiDelete<DeleteSubCategoriaProductoResponse>(`/productos/sub-categorias/${id}`, {
      data: {},
    })
  },
}
