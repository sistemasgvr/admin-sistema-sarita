import { apiDelete, apiGet, apiGetPaginated, apiPatch, apiPost } from '@/shared/api/apiClient'
import type {
  AsignacionOrigenesRecarga,
  BalonOrigenRecarga,
  CreateMovimientoRecargaPayload,
  CreateRecargaClientePayload,
  DeleteMovimientoRecargaResponse,
  MovimientoRecarga,
  MovimientoRecargaListFilters,
  OrigenRecargaFilters,
  RecargaClienteResult,
  UpdateMovimientoRecargaPayload,
  VincularRecargaClienteComprobantePayload,
} from '@/modules/balones/recargas/interfaces/movimiento-recarga.interface'

export const movimientosRecargaService = {
  listar(filters: MovimientoRecargaListFilters = {}) {
    return apiGetPaginated<MovimientoRecarga>('/balones/movimientos-recarga', { params: filters })
  },

  listarOrigenes(filters: OrigenRecargaFilters) {
    return apiGetPaginated<BalonOrigenRecarga>('/balones/movimientos-recarga/origenes-recarga', {
      params: filters,
    })
  },

  sugerirOrigen(filters: OrigenRecargaFilters) {
    return apiGet<BalonOrigenRecarga>('/balones/movimientos-recarga/sugerir-origen', {
      params: filters,
    })
  },

  /** Asigna uno o más balones empresa (FIFO) para cubrir la capacidad pedida. */
  asignarOrigenes(filters: OrigenRecargaFilters) {
    return apiGet<AsignacionOrigenesRecarga>('/balones/movimientos-recarga/asignar-origenes', {
      params: filters,
    })
  },

  obtenerPorId(id: number) {
    return apiGet<MovimientoRecarga>(`/balones/movimientos-recarga/${id}`)
  },

  crear(payload: CreateMovimientoRecargaPayload) {
    return apiPost<MovimientoRecarga>('/balones/movimientos-recarga', payload)
  },

  crearRecargaCliente(payload: CreateRecargaClientePayload) {
    return apiPost<RecargaClienteResult>('/balones/movimientos-recarga/recarga-cliente', payload)
  },

  vincularRecargaClienteComprobante(payload: VincularRecargaClienteComprobantePayload) {
    return apiPost<MovimientoRecarga>(
      '/balones/movimientos-recarga/vincular-cliente-comprobante',
      payload,
    )
  },

  actualizar(id: number, payload: UpdateMovimientoRecargaPayload) {
    return apiPatch<MovimientoRecarga>(`/balones/movimientos-recarga/${id}`, payload)
  },

  eliminar(id: number, idUsuarioAuditoria: number) {
    return apiDelete<DeleteMovimientoRecargaResponse>(`/balones/movimientos-recarga/${id}`, {
      data: { idUsuarioAuditoria },
    })
  },
}
