import {
  apiDelete,
  apiGet,
  apiGetPaginated,
  apiPatch,
  apiPost,
} from '@/shared/api/apiClient'
import type {
  ConfiguracionServicio,
  ConfiguracionServicioListFilters,
  CreateConfiguracionServicioPayload,
  DeleteConfiguracionServicioResponse,
  UpdateConfiguracionServicioPayload,
} from '@/modules/configuracion/servicios/interfaces/configuracion-servicio.interface'

export const configuracionServiciosService = {
  listar(filters: ConfiguracionServicioListFilters = {}) {
    return apiGetPaginated<ConfiguracionServicio>('/configuracion/servicios', { params: filters })
  },

  obtenerPorId(id: number) {
    return apiGet<ConfiguracionServicio>(`/configuracion/servicios/${id}`)
  },

  crear(payload: CreateConfiguracionServicioPayload) {
    return apiPost<ConfiguracionServicio>('/configuracion/servicios', payload)
  },

  actualizar(id: number, payload: UpdateConfiguracionServicioPayload) {
    return apiPatch<ConfiguracionServicio>(`/configuracion/servicios/${id}`, payload)
  },

  eliminar(id: number) {
    return apiDelete<DeleteConfiguracionServicioResponse>(`/configuracion/servicios/${id}`, {
      data: {},
    })
  },
}
