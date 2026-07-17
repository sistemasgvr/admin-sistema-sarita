import { apiGet, apiGetPaginated, apiPatch, apiPost } from '@/shared/api/apiClient'
import type {
  AprobarBajaClientePayload,
  BajaCliente,
  BajaClienteDetail,
  BajaClienteListFilters,
  RechazarBajaClientePayload,
  SolicitarBajaClientePayload,
} from '@/modules/clientes/bajas-cliente/interfaces/baja-cliente.interface'

export const bajasClienteService = {
  listar(filters: BajaClienteListFilters = {}) {
    return apiGetPaginated<BajaCliente>('/bajas-cliente', { params: filters })
  },

  obtenerPorId(id: number) {
    return apiGet<BajaClienteDetail>(`/bajas-cliente/${id}`)
  },

  solicitar(payload: SolicitarBajaClientePayload) {
    return apiPost<BajaCliente>('/bajas-cliente', payload)
  },

  aprobar(id: number, payload: AprobarBajaClientePayload) {
    return apiPatch<BajaCliente>(`/bajas-cliente/${id}/aprobar`, payload)
  },

  rechazar(id: number, payload: RechazarBajaClientePayload) {
    return apiPatch<BajaCliente>(`/bajas-cliente/${id}/rechazar`, payload)
  },
}
