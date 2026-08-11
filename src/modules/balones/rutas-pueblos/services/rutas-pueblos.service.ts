import { apiDelete, apiGet, apiGetPaginated, apiPatch, apiPost } from '@/shared/api/apiClient'
import type {
  CerrarRutaPuebloPayload,
  CreateRutaPuebloPayload,
  DeleteRutaPuebloResponse,
  RegistrarRetornoRutaPuebloPayload,
  RutaPueblo,
  RutaPuebloListFilters,
  UpdateRutaPuebloPayload,
} from '@/modules/balones/rutas-pueblos/interfaces/ruta-pueblo.interface'

export const rutasPueblosService = {
  listar(filters: RutaPuebloListFilters = {}) {
    return apiGetPaginated<RutaPueblo>('/balones/rutas-pueblos', { params: filters })
  },

  obtenerPorId(id: number) {
    return apiGet<RutaPueblo>(`/balones/rutas-pueblos/${id}`)
  },

  crear(payload: CreateRutaPuebloPayload) {
    return apiPost<RutaPueblo>('/balones/rutas-pueblos', payload)
  },

  actualizar(id: number, payload: UpdateRutaPuebloPayload) {
    return apiPatch<RutaPueblo>(`/balones/rutas-pueblos/${id}`, payload)
  },

  iniciar(id: number, idUsuarioAuditoria: number) {
    return apiPost<RutaPueblo>(`/balones/rutas-pueblos/${id}/iniciar`, {
      idUsuarioAuditoria,
    })
  },

  registrarRetorno(id: number, payload: RegistrarRetornoRutaPuebloPayload) {
    return apiPost<RutaPueblo>(`/balones/rutas-pueblos/${id}/registrar-retorno`, payload)
  },

  cerrar(id: number, payload: CerrarRutaPuebloPayload) {
    return apiPost<RutaPueblo>(`/balones/rutas-pueblos/${id}/cerrar`, payload)
  },

  eliminar(id: number, idUsuarioAuditoria: number) {
    return apiDelete<DeleteRutaPuebloResponse>(`/balones/rutas-pueblos/${id}`, {
      data: { idUsuarioAuditoria },
    })
  },
}
