import {
  apiDelete,
  apiGet,
  apiGetPaginated,
  apiPatch,
  apiPost,
} from '@/shared/api/apiClient'
import type {
  Compra,
  CompraListItem,
  CompraListFilters,
  CreateCompraPayload,
  UpdateCompraPayload,
} from '@/modules/compras/interfaces/compra.interface'

export const comprasService = {
  listar(filters: CompraListFilters) {
    return apiGetPaginated<CompraListItem>('/finanzas/compras', {
      params: filters,
    })
  },

  obtenerPorId(id: number) {
    return apiGet<Compra>(`/finanzas/compras/${id}`)
  },

  crear(payload: CreateCompraPayload) {
    return apiPost<Compra>('/finanzas/compras', payload)
  },

  actualizar(id: number, payload: UpdateCompraPayload) {
    return apiPatch<Compra>(`/finanzas/compras/${id}`, payload)
  },

  eliminar(id: number, idUsuarioAuditoria: number) {
    return apiDelete<{ eliminado: boolean; id: number }>(`/finanzas/compras/${id}`, {
      data: { idUsuarioAuditoria },
    })
  },
}
