import { apiDelete, apiGet, apiGetPaginated, apiPatch, apiPost } from '@/shared/api/apiClient'
import type {
  CreateRecojoPayload,
  DeleteRecojoResponse,
  Recojo,
  RecojoListFilters,
  PendienteRecojo,
  PendienteRecojoFilters,
  RegistrarResultadoRecojoPayload,
  UpdateRecojoPayload,
} from '@/modules/balones/recojos/interfaces/recojo.interface'

export const recojosService = {
  listar(filters: RecojoListFilters = {}) {
    return apiGetPaginated<Recojo>('/balones/recojos', { params: filters })
  },

  listarPendientes(filters: PendienteRecojoFilters = {}) {
    return apiGetPaginated<PendienteRecojo>('/balones/recojos/pendientes', { params: filters })
  },

  obtenerPorId(id: number) {
    return apiGet<Recojo>(`/balones/recojos/${id}`)
  },

  crear(payload: CreateRecojoPayload) {
    return apiPost<Recojo>('/balones/recojos', payload)
  },

  actualizar(id: number, payload: UpdateRecojoPayload) {
    return apiPatch<Recojo>(`/balones/recojos/${id}`, payload)
  },

  registrarResultado(id: number, payload: RegistrarResultadoRecojoPayload) {
    return apiPost<Recojo>(`/balones/recojos/${id}/registrar-resultado`, payload)
  },

  validarCodigos(id: number, codigos: string[]) {
    return apiPost<{
      ok: boolean
      total: number
      coinciden: Array<{ idPrestamoDetalle?: number; idAlquilerDetalle?: number; codigo: string }>
      faltantes: Array<{ idPrestamoDetalle?: number; idAlquilerDetalle?: number; codigo: string }>
      no_pertenecen: string[]
      completo: boolean
    }>(`/balones/recojos/${id}/validar-codigos`, { codigos })
  },

  eliminar(id: number, idUsuarioAuditoria: number) {
    return apiDelete<DeleteRecojoResponse>(`/balones/recojos/${id}`, {
      data: { idUsuarioAuditoria },
    })
  },
}
