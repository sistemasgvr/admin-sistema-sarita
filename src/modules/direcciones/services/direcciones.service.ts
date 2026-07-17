import {
  apiDelete,
  apiGet,
  apiGetPaginated,
  apiPatch,
  apiPost,
} from '@/shared/api/apiClient'
import type {
  CreateDireccionPayload,
  DeleteDireccionResponse,
  Direccion,
  DireccionListFilters,
  UpdateDireccionPayload,
} from '@/modules/direcciones/interfaces/direccion.interface'

export interface CoordenadasDesdeLinkResponse {
  latitud: number
  longitud: number
}

export const direccionesService = {
  listar(filters: DireccionListFilters = {}) {
    return apiGetPaginated<Direccion>('/direcciones', { params: filters })
  },

  obtenerPorId(id: number) {
    return apiGet<Direccion>(`/direcciones/${id}`)
  },

  crear(payload: CreateDireccionPayload) {
    return apiPost<Direccion>('/direcciones', payload)
  },

  actualizar(id: number, payload: UpdateDireccionPayload) {
    return apiPatch<Direccion>(`/direcciones/${id}`, payload)
  },

  eliminar(id: number, idUsuarioAuditoria: number) {
    return apiDelete<DeleteDireccionResponse>(`/direcciones/${id}`, {
      data: { idUsuarioAuditoria },
    })
  },

  coordenadasDesdeLink(link: string) {
    return apiPost<CoordenadasDesdeLinkResponse>('/direcciones/coordenadas-desde-link', { link })
  },
}
