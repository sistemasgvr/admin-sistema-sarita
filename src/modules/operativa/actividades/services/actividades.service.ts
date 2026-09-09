import { apiDelete, apiGet, apiGetPaginated, apiPatch, apiPost } from '@/shared/api/apiClient'
import type { PaginatedResult } from '@/shared/api/interfaces/api.interface'
import type {
  CrearRecojoOrigenPayload,
  CrearRecojoPrestamoPayload,
  CrearRecojoResult,
  GenerarRecojosPayload,
  GenerarRecojosResult,
  OrigenVencidoRecojo,
  OrigenVencidoRecojoFilters,
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
  listarVencidosRecojo(
    filters: OrigenVencidoRecojoFilters = {},
  ): Promise<PaginatedResult<OrigenVencidoRecojo[]>> {
    return apiGetPaginated<OrigenVencidoRecojo>('/operativa/actividades/vencidos-recojo', {
      params: filters,
    })
  },

  verificar(id: number, payload: VerificarActividadPayload) {
    return apiPost<VerificarActividadResult>(
      `/operativa/actividades/${id}/verificar`,
      payload,
    )
  },

  iniciarVerificacion(id: number, idUsuarioAuditoria?: number) {
    return apiPost<Actividad>(`/operativa/actividades/${id}/iniciar-verificacion`, {
      idUsuarioAuditoria,
    })
  },

  crearRecojo(payload: CrearRecojoOrigenPayload) {
    return apiPost<CrearRecojoResult>('/operativa/actividades/recojo', payload)
  },

  crearRecojoPrestamo(payload: CrearRecojoPrestamoPayload) {
    return apiPost<CrearRecojoResult>('/operativa/actividades/recojo-prestamo', payload)
  },

  generarRecojos(payload: GenerarRecojosPayload) {
    return apiPost<GenerarRecojosResult>('/operativa/actividades/generar-recojos', payload)
  },

  ranking(filters: RankingActividadesFilters = {}) {
    return apiGetPaginated<RankingActividadFila>('/operativa/actividades/ranking', { params: filters })
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
