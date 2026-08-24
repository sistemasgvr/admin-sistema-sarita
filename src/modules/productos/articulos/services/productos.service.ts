import {
  apiDelete,
  apiGet,
  apiGetPaginated,
  apiPatch,
  apiPost,
  apiPostBlob,
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
    // Por defecto sin firmar imágenes (rápido para selects). Quien necesite
    // miniaturas debe pasar incluirImagenes: true.
    return apiGetPaginated<Producto>('/productos', {
      params: { incluirImagenes: false, ...filters },
    })
  },

  obtenerPorId(id: number) {
    return apiGet<Producto>(`/productos/${id}`)
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

  restaurar(id: number, idUsuarioAuditoria?: number) {
    return apiPatch<DeleteProductoResponse>(`/productos/${id}/restaurar`, {
      idUsuarioAuditoria,
    })
  },

  generarCodigoUbicacion(payload: {
    nombre: string
    marca?: string
    idProducto?: number
  }) {
    return apiPost<{ codigo_ubicacion: string }>('/productos/codigo-ubicacion/generar', payload)
  },

  generarCodigoProducto(payload: {
    prefijo?: string
    esServicio?: boolean
    esGas?: boolean
  } = {}) {
    return apiPost<{ codigo: string }>('/productos/codigo/generar', payload)
  },

  imprimirUbicacionesPdf(ids: number[]) {
    return apiPostBlob('/productos/ubicaciones/pdf', { ids })
  },
}
