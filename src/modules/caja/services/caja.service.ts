import { apiDelete, apiGet, apiGetPaginated, apiPatch, apiPost } from '@/shared/api/apiClient'
import type {
  AbrirCajaPayload,
  CajaSesion,
  CerrarCajaPayload,
  CrearCajaDepositoPayload,
  CrearCajaGastoPayload,
  CrearCajaObservacionPayload,
  LibroDiario,
  LibroDiarioDeposito,
  LibroDiarioFilters,
  LibroDiarioGasto,
  LibroDiarioObservacion,
} from '@/modules/caja/interfaces/caja.interface'

export const cajaService = {
  obtenerDia(fecha: string, idSucursal?: number | null) {
    return apiGet<CajaSesion>('/caja/dia', {
      params: { fecha, idSucursal: idSucursal ?? undefined },
    })
  },

  listarSesiones(filters: Record<string, unknown> = {}) {
    return apiGetPaginated<CajaSesion>('/caja/sesiones', { params: filters })
  },

  obtenerSesion(id: number) {
    return apiGet<CajaSesion>(`/caja/sesiones/${id}`)
  },

  abrir(payload: AbrirCajaPayload) {
    return apiPost<CajaSesion>('/caja/sesiones/abrir', payload)
  },

  cerrar(id: number, payload: CerrarCajaPayload) {
    return apiPatch<CajaSesion>(`/caja/sesiones/${id}/cerrar`, payload)
  },

  crearGasto(payload: CrearCajaGastoPayload) {
    return apiPost<LibroDiarioGasto>('/caja/gastos', payload)
  },

  eliminarGasto(id: number, idUsuarioAuditoria?: number) {
    return apiDelete(`/caja/gastos/${id}`, { data: { idUsuarioAuditoria } })
  },

  crearDeposito(payload: CrearCajaDepositoPayload) {
    return apiPost<LibroDiarioDeposito>('/caja/depositos', payload)
  },

  eliminarDeposito(id: number, idUsuarioAuditoria?: number) {
    return apiDelete(`/caja/depositos/${id}`, { data: { idUsuarioAuditoria } })
  },

  crearObservacion(payload: CrearCajaObservacionPayload) {
    return apiPost<LibroDiarioObservacion>('/caja/observaciones', payload)
  },

  eliminarObservacion(id: number, idUsuarioAuditoria?: number) {
    return apiDelete(`/caja/observaciones/${id}`, { data: { idUsuarioAuditoria } })
  },

  libroDiario(filters: LibroDiarioFilters) {
    return apiGet<LibroDiario>('/caja/libro-diario', { params: filters })
  },
}
