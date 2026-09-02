import { apiGet, apiGetPaginated, apiPost, apiDelete } from '@/shared/api/apiClient'
import type {
  InventarioMovimientoListItem,
  InventarioMovimientoFilters,
  CreateInventarioMovimientoPayload,
} from '../interfaces/inventario-movimiento.interface'

export const inventarioMovimientosService = {
  listar(filters: InventarioMovimientoFilters) {
    return apiGetPaginated<InventarioMovimientoListItem>('/inventario/movimientos', { params: filters })
  },
  obtenerPorId(id: number) {
    return apiGet<InventarioMovimientoListItem>(`/inventario/movimientos/${id}`)
  },
  crear(payload: CreateInventarioMovimientoPayload) {
    return apiPost<{ id: number }>('/inventario/movimientos', payload)
  },
  eliminar(id: number, idUsuarioAuditoria: number) {
    return apiDelete(`/inventario/movimientos/${id}`, { data: { idUsuarioAuditoria } })
  },
}
