import { apiClient, apiDelete } from '@/shared/api/apiClient'
import type { ApiResponse, PaginatedResult } from '@/shared/api/interfaces/api.interface'
import type {
  Actividad,
  ActividadListFilters,
  ActividadListRawData,
  ActividadRegistroRawData,
  CreateActividadPayload,
  DeleteActividadResponse,
  UpdateActividadPayload,
} from '@/modules/operativa/actividades/interfaces/actividad.interface'

// El backend de /operativa/actividades no sigue el envoltorio genérico
// { data: T[], meta } ni { data: T } que usan apiGetPaginated/apiGet/apiPost.
// En su lugar responde { data: { registros, total } } y
// { data: { registro } }, por lo que se hace el unwrap manualmente aquí.

export const actividadesService = {
  async listar(filters: ActividadListFilters = {}): Promise<PaginatedResult<Actividad[]>> {
    const response = await apiClient.get<ApiResponse<ActividadListRawData>>(
      '/operativa/actividades',
      { params: filters },
    )

    const { registros, total } = response.data.data

    return {
      data: registros ?? [],
      meta: {
        pagina: filters.pagina ?? 1,
        limite: filters.limite ?? registros?.length ?? 10,
        total: total ?? registros?.length ?? 0,
      },
    }
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
