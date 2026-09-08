import { apiDelete, apiGet, apiGetPaginated, apiPatch, apiPost } from '@/shared/api/apiClient'
import type { PaginatedResult } from '@/shared/api/interfaces/api.interface'
import type {
  CrearRecojoPrestamoPayload,
  GenerarRecojosPayload,
  GenerarRecojosResult,
  RankingActividadFila,
  RankingActividadesFilters,
  VerificarActividadPayload,
  VerificarActividadResult,
  Actividad,
  ActividadListFilters,
  CreateActividadPayload,
  DeleteActividadResponse,
  UpdateActividadPayload,
} from '@/modules/operativa/actividades/interfaces/actividad.interface'

export const actividadesService = {
  verificar(id: number, payload: VerificarActividadPayload) {
    return apiPost<VerificarActividadResult>(`/actividades/${id}/verificar`, payload)
  },

  crearRecojoPrestamo(payload: CrearRecojoPrestamoPayload) {
    return apiPost<{ id: number; creada: boolean; items: number }>(
      '/actividades/recojo-prestamo',
      payload,
    )
  },

  generarRecojos(payload: GenerarRecojosPayload) {
    return apiPost<GenerarRecojosResult>('/actividades/generar-recojos', payload)
  },

  ranking(filters: RankingActividadesFilters = {}) {
    return apiGetPaginated<RankingActividadFila>('/actividades/ranking', { params: filters })
  },

  listar(filters: ActividadListFilters = {}): Promise<PaginatedResult<Actividad[]>> {
    return apiGetPaginated<Actividad>('/operativa/actividades', { params: filters })
  },

  listarProximas(minutos = 60): Promise<Actividad[]> {
    return apiGet<Actividad[]>('/operativa/actividades/proximas', {
      params: { minutos },
    })
  },

  obtenerPorId(id: number): Promise<Actividad> {
    return apiGet<Actividad>(`/operativa/actividades/${id}`)
  },

  crear(payload: CreateActividadPayload): Promise<Actividad> {
    return apiPost<Actividad>('/operativa/actividades', payload)
  },

  actualizar(id: number, payload: UpdateActividadPayload): Promise<Actividad> {
    return apiPatch<Actividad>(`/operativa/actividades/${id}`, payload)
  },

  eliminar(id: number, idUsuarioAuditoria: number) {
    return apiDelete<DeleteActividadResponse>(`/operativa/actividades/${id}`, {
      data: { idUsuarioAuditoria },
    })
  },

  marcarComoRealizada(id: number, idUsuarioAuditoria: number): Promise<Actividad> {
    return apiPatch<Actividad>(`/operativa/actividades/${id}/realizada`, {
      idUsuarioAuditoria,
    })
  },

  cancelar(id: number, idUsuarioAuditoria: number): Promise<Actividad> {
    return apiPatch<Actividad>(`/operativa/actividades/${id}/cancelar`, {
      idUsuarioAuditoria,
    })
  },

  asignarResponsable(
    id: number,
    payload: {
      idUsuarioAuditoria: number
      idTrabajadorResponsable?: number | null
    },
  ): Promise<Actividad> {
    return apiPatch<Actividad>(`/operativa/actividades/${id}/responsable`, payload)
  },
}
