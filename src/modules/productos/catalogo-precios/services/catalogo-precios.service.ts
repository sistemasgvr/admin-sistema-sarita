import {
  apiDelete,
  apiGetPaginated,
  apiPatch,
  apiPost,
} from '@/shared/api/apiClient'
import type {
  CatalogoPrecio,
  CatalogoPrecioListFilters,
  CreateCatalogoPrecioPayload,
  DeleteCatalogoPrecioResponse,
  UpdateCatalogoPrecioPayload,
} from '@/modules/productos/catalogo-precios/interfaces/catalogo-precio.interface'

export const catalogoPreciosService = {
  listar(filters: CatalogoPrecioListFilters = {}) {
    return apiGetPaginated<CatalogoPrecio>('/productos/catalogo-precios', { params: filters })
  },

  crear(payload: CreateCatalogoPrecioPayload) {
    return apiPost<CatalogoPrecio>('/productos/catalogo-precios', payload)
  },

  actualizar(id: number, payload: UpdateCatalogoPrecioPayload) {
    return apiPatch<CatalogoPrecio>(`/productos/catalogo-precios/${id}`, payload)
  },

  eliminar(id: number) {
    return apiDelete<DeleteCatalogoPrecioResponse>(`/productos/catalogo-precios/${id}`, {
      data: {},
    })
  },
}
