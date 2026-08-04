import { apiClient, apiDelete, apiGetPaginated } from '@/shared/api/apiClient'
import type { ApiResponse, PaginatedResult } from '@/shared/api/interfaces/api.interface'
import type {
  Actividad,
  ActividadListFilters,
  ActividadRegistroRawData,
  CreateActividadPayload,
  DeleteActividadResponse,
  UpdateActividadPayload,
} from '@/modules/operativa/actividades/interfaces/actividad.interface'

export const actividadesService = {
  listar(filters: ActividadListFilters = {}): Promise<PaginatedResult<Actividad[]>> {
    return apiGetPaginated<Actividad>('/operativa/actividades', { params: filters })
  },

  async obtenerPorId(id: number): Promise<Actividad> {
    const response = await apiClient.get<ApiResponse<ActividadRegistroRawData>>(
      `/operativa/actividades/${id}`,
    )
    return response.data.data.registro
  },

  async crear(payload: CreateActividadPayload): Promise<Actividad> {
    const response = await apiClient.post<ApiResponse<ActividadRegistroRawData>>(
      '/operativa/actividades',
      payload,
    )
    return response.data.data.registro
  },

  async actualizar(id: number, payload: UpdateActividadPayload): Promise<Actividad> {
    const response = await apiClient.patch<ApiResponse<ActividadRegistroRawData>>(
      `/operativa/actividades/${id}`,
      payload,
    )
    return response.data.data.registro
  },

  eliminar(id: number, idUsuarioAuditoria: number) {
    return apiDelete<DeleteActividadResponse>(`/operativa/actividades/${id}`, {
      data: { idUsuarioAuditoria },
    })
  },
}
