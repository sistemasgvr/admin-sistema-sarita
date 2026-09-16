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
  GreEmpresaVerificacion,
  GreSincronizacionResultado,
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

  /** Solo lecturas al PSE: RUC, entorno, URLs y credenciales GRE de la empresa. */
  verificarGre(idEmpresa: number) {
    return apiPost<GreEmpresaVerificacion>(`/configuracion/sunat/empresa/${idEmpresa}/verificar-gre`, {})
  },

  /** Única acción que escribe credenciales GRE en la empresa del PSE. */
  sincronizarGre(idEmpresa: number) {
    return apiPost<GreSincronizacionResultado>(`/configuracion/sunat/empresa/${idEmpresa}/sincronizar-gre`, {})
  },

  eliminar(id: number) {
    return apiDelete<DeleteConfiguracionSunatResponse>(`/configuracion/sunat/${id}`, {
      data: {},
    })
  },
}
