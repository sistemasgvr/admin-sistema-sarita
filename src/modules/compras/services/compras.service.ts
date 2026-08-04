import {
  apiDelete,
  apiGet,
  apiGetPaginated,
  apiPatch,
  apiPost,
} from '@/shared/api/apiClient'
import type {
  ActualizarCompraCabeceraPayload,
  ActualizarCompraDetallePayload,
  Compra,
  CompraListItem,
  CompraListFilters,
  CreateCompraDetalleLineaPayload,
  CreateCompraPayload,
  EliminarCompraResponse,
} from '@/modules/compras/interfaces/compra.interface'

export const comprasService = {
  listar(filters: CompraListFilters) {
    return apiGetPaginated<CompraListItem>('/compras', {
      params: filters,
    })
  },

  obtenerPorId(id: number) {
    return apiGet<Compra>(`/compras/${id}`)
  },

  crear(payload: CreateCompraPayload) {
    return apiPost<Compra>('/compras', payload)
  },

  actualizarCabecera(id: number, payload: ActualizarCompraCabeceraPayload) {
    return apiPatch<Compra>(`/compras/${id}`, payload)
  },

  crearDetalle(id: number, payload: CreateCompraDetalleLineaPayload) {
    return apiPost<Compra>(`/compras/${id}/detalle`, payload)
  },

  actualizarDetalle(idDetalle: number, payload: ActualizarCompraDetallePayload) {
    return apiPatch<Compra>(`/compras/detalle/${idDetalle}`, payload)
  },

  eliminarDetalle(idDetalle: number, idUsuarioAuditoria: number) {
    return apiDelete<EliminarCompraResponse>(`/compras/detalle/${idDetalle}`, {
      data: { idUsuarioAuditoria },
    })
  },

  anular(id: number, idUsuarioAuditoria: number) {
    return apiDelete<EliminarCompraResponse>(`/compras/${id}`, {
      data: { idUsuarioAuditoria },
    })
  },
}
