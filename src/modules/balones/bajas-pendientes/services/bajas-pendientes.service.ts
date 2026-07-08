import { apiGetPaginated, apiPost } from '@/shared/api/apiClient'
import type {
  AprobarBajaPayload,
  BajaSolicitud,
  BajaSolicitudListFilters,
  RechazarBajaPayload,
} from '@/modules/balones/bajas-pendientes/interfaces/baja-solicitud.interface'
import type { BalonBaja } from '@/modules/balones/cilindros/interfaces/balon.interface'

export const bajasPendientesService = {
  listar(filters: BajaSolicitudListFilters = {}) {
    return apiGetPaginated<BajaSolicitud>('/balones/bajas/pendientes', { params: filters })
  },

  aprobar(idBaja: number, payload: AprobarBajaPayload) {
    return apiPost<BalonBaja>(`/balones/bajas/${idBaja}/aprobar`, payload)
  },

  rechazar(idBaja: number, payload: RechazarBajaPayload) {
    return apiPost<BalonBaja>(`/balones/bajas/${idBaja}/rechazar`, payload)
  },
}
