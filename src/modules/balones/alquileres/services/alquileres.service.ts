import { apiDelete, apiGet, apiGetPaginated, apiPatch, apiPost } from '@/shared/api/apiClient'
import type {
  Alquiler,
  AlquilerListFilters,
  CreateAlquilerPayload,
  DeleteAlquilerResponse,
  UpdateAlquilerPayload,
} from '@/modules/balones/alquileres/interfaces/alquiler.interface'
import type {
  AlquilerPeriodo,
  RegistrarAlquilerPeriodoPayload,
  RenovarAlquilerPayload,
} from '@/modules/balones/alquileres/interfaces/alquiler-periodo.interface'

export const alquileresService = {
  listar(filters: AlquilerListFilters = {}) {
    return apiGetPaginated<Alquiler>('/balones/alquileres', { params: filters })
  },

  obtenerPorId(id: number) {
    return apiGet<Alquiler>(`/balones/alquileres/${id}`)
  },

  crear(payload: CreateAlquilerPayload) {
    return apiPost<Alquiler>('/balones/alquileres', payload)
  },

  actualizar(id: number, payload: UpdateAlquilerPayload) {
    return apiPatch<Alquiler>(`/balones/alquileres/${id}`, payload)
  },

  eliminar(id: number, idUsuarioAuditoria: number) {
    return apiDelete<DeleteAlquilerResponse>(`/balones/alquileres/${id}`, {
      data: { idUsuarioAuditoria },
    })
  },

  listarPeriodos(idAlquiler: number, params: { pagina?: number; limite?: number } = {}) {
    return apiGetPaginated<AlquilerPeriodo>(`/balones/alquileres/${idAlquiler}/periodos`, {
      params,
    })
  },

  registrarPeriodo(idAlquiler: number, payload: RegistrarAlquilerPeriodoPayload) {
    return apiPost<AlquilerPeriodo>(`/balones/alquileres/${idAlquiler}/periodos`, payload)
  },

  renovar(idAlquiler: number, payload: RenovarAlquilerPayload) {
    return apiPost<Alquiler>(`/balones/alquileres/${idAlquiler}/renovar`, payload)
  },
}
