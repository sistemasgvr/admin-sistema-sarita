import { apiDelete, apiGet, apiGetPaginated, apiPatch, apiPost } from '@/shared/api/apiClient'
import type {
  Balon,
  BalonBaja,
  BalonEstadoHistorial,
  BalonListFilters,
  BalonPhHistorial,
  CreateBalonPayload,
  DarBajaBalonPayload,
  DeleteBalonResponse,
  RegistrarPhHistorialPayload,
  RestaurarBalonPayload,
  UpdateBalonPayload,
} from '@/modules/balones/cilindros/interfaces/balon.interface'

export const balonesService = {
  listar(filters: BalonListFilters = {}) {
    return apiGetPaginated<Balon>('/balones', { params: filters })
  },

  obtenerPorId(id: number) {
    return apiGet<Balon>(`/balones/${id}`)
  },

  crear(payload: CreateBalonPayload) {
    return apiPost<Balon>('/balones', payload)
  },

  actualizar(id: number, payload: UpdateBalonPayload) {
    return apiPatch<Balon>(`/balones/${id}`, payload)
  },

  eliminar(id: number, idUsuarioAuditoria: number) {
    return apiDelete<DeleteBalonResponse>(`/balones/${id}`, {
      data: { idUsuarioAuditoria },
    })
  },

  listarPhHistorial(idBalon: number, params: { pagina?: number; limite?: number } = {}) {
    return apiGetPaginated<BalonPhHistorial>(`/balones/${idBalon}/ph-historial`, { params })
  },

  registrarPhHistorial(idBalon: number, payload: RegistrarPhHistorialPayload) {
    return apiPost<BalonPhHistorial>(`/balones/${idBalon}/ph-historial`, payload)
  },

  obtenerBaja(idBalon: number) {
    return apiGet<BalonBaja | null>(`/balones/${idBalon}/baja`)
  },

  darBaja(idBalon: number, payload: DarBajaBalonPayload) {
    return apiPost<BalonBaja>(`/balones/${idBalon}/baja`, payload)
  },

  listarEstadoHistorial(idBalon: number, params: { pagina?: number; limite?: number } = {}) {
    return apiGetPaginated<BalonEstadoHistorial>(`/balones/${idBalon}/estado-historial`, {
      params,
    })
  },

  restaurar(idBalon: number, payload: RestaurarBalonPayload) {
    return apiPost<Balon>(`/balones/${idBalon}/restaurar`, payload)
  },
}
