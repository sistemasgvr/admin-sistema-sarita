import {
  apiDelete,
  apiGetPaginated,
  apiPatch,
  apiPost,
} from '@/shared/api/apiClient'
import type {
  CreateMovimientoInventarioPayload,
  DeleteMovimientoInventarioResponse,
  MovimientoInventario,
  MovimientoInventarioListFilters,
  UpdateMovimientoInventarioPayload,
} from '@/modules/productos/movimientos/interfaces/movimiento-inventario.interface'

export const movimientosInventarioService = {
  listar(filters: MovimientoInventarioListFilters = {}) {
    return apiGetPaginated<MovimientoInventario>('/productos/movimientos', { params: filters })
  },

  crear(payload: CreateMovimientoInventarioPayload) {
    return apiPost<MovimientoInventario>('/productos/movimientos', payload)
  },

  actualizar(id: number, payload: UpdateMovimientoInventarioPayload) {
    return apiPatch<MovimientoInventario>(`/productos/movimientos/${id}`, payload)
  },

  eliminar(id: number) {
    return apiDelete<DeleteMovimientoInventarioResponse>(`/productos/movimientos/${id}`, {
      data: {},
    })
  },
}
