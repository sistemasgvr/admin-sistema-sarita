import {
  apiDelete,
  apiGet,
  apiGetPaginated,
  apiPatch,
  apiPost,
} from '@/shared/api/apiClient'
import type {
  ActualizarCompraCabeceraPayload,
  Compra,
  CompraListItem,
  CompraListFilters,
  CreateCompraDetalleLineaPayload,
  CreateCompraPayload,
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

  actualizarCabecera(id: number, payload: ActualizarCompraCabeceraPayload) {
    return apiPatch<Compra>(`/finanzas/compras/${id}`, payload)
  },

  crearDetalle(id: number, payload: CreateCompraDetalleLineaPayload) {
    return apiPost<Compra>(`/finanzas/compras/${id}/detalle`, payload)
  },

  eliminarDetalle(idDetalle: number, idUsuarioAuditoria: number) {
    return apiDelete<Compra>(`/finanzas/compras/detalle/${idDetalle}`, {
      data: { idUsuarioAuditoria },
    })
  },

  anular(id: number, idUsuarioAuditoria: number) {
    return apiDelete<{ id: number; anulado: boolean }>(`/finanzas/compras/${id}`, {
      data: { idUsuarioAuditoria },
    })
  },
}
