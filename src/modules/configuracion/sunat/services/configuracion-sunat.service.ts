import {
  apiDelete,
  apiGet,
  apiGetPaginated,
  apiPatch,
  apiPost,
} from '@/shared/api/apiClient'
import type {
  ConfiguracionSunat,
  ConfiguracionSunatListFilters,
  CreateConfiguracionSunatPayload,
  DeleteConfiguracionSunatResponse,
  UpdateConfiguracionSunatPayload,
} from '@/modules/configuracion/sunat/interfaces/configuracion-sunat.interface'

export const configuracionSunatService = {
  listar(filters: ConfiguracionSunatListFilters = {}) {
    return apiGetPaginated<ConfiguracionSunat>('/configuracion/sunat', { params: filters })
  },

  obtenerPorId(id: number) {
    return apiGet<ConfiguracionSunat>(`/configuracion/sunat/${id}`)
  },

  crear(payload: CreateConfiguracionSunatPayload) {
    return apiPost<ConfiguracionSunat>('/configuracion/sunat', payload)
  },

  actualizar(id: number, payload: UpdateConfiguracionSunatPayload) {
    return apiPatch<ConfiguracionSunat>(`/configuracion/sunat/${id}`, payload)
  },

  eliminar(id: number) {
    return apiDelete<DeleteConfiguracionSunatResponse>(`/configuracion/sunat/${id}`, {
      data: {},
    })
  },
}
