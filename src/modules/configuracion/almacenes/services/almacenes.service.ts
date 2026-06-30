import {
  apiDelete,
  apiGet,
  apiGetPaginated,
  apiPatch,
  apiPost,
} from '@/shared/api/apiClient'
import type {
  Almacen,
  AlmacenListFilters,
  CreateAlmacenPayload,
  DeleteAlmacenResponse,
  UpdateAlmacenPayload,
} from '@/modules/configuracion/almacenes/interfaces/almacen.interface'

export const almacenesService = {
  listar(filters: AlmacenListFilters = {}) {
    return apiGetPaginated<Almacen>('/configuracion/almacenes', { params: filters })
  },

  obtenerPorId(id: number) {
    return apiGet<Almacen>(`/configuracion/almacenes/${id}`)
  },

  crear(payload: CreateAlmacenPayload) {
    return apiPost<Almacen>('/configuracion/almacenes', payload)
  },

  actualizar(id: number, payload: UpdateAlmacenPayload) {
    return apiPatch<Almacen>(`/configuracion/almacenes/${id}`, payload)
  },

  eliminar(id: number) {
    return apiDelete<DeleteAlmacenResponse>(`/configuracion/almacenes/${id}`, { data: {} })
  },
}
