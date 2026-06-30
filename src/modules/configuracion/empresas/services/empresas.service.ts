import {
  apiDelete,
  apiGet,
  apiGetPaginated,
  apiPatch,
  apiPost,
} from '@/shared/api/apiClient'
import type {
  CreateEmpresaPayload,
  DeleteEmpresaResponse,
  Empresa,
  EmpresaListFilters,
  UpdateEmpresaPayload,
} from '@/modules/configuracion/empresas/interfaces/empresa.interface'

export const empresasService = {
  listar(filters: EmpresaListFilters = {}) {
    return apiGetPaginated<Empresa>('/configuracion/empresas', { params: filters })
  },

  obtenerPorId(id: number) {
    return apiGet<Empresa>(`/configuracion/empresas/${id}`)
  },

  crear(payload: CreateEmpresaPayload) {
    return apiPost<Empresa>('/configuracion/empresas', payload)
  },

  actualizar(id: number, payload: UpdateEmpresaPayload) {
    return apiPatch<Empresa>(`/configuracion/empresas/${id}`, payload)
  },

  eliminar(id: number) {
    return apiDelete<DeleteEmpresaResponse>(`/configuracion/empresas/${id}`, { data: {} })
  },
}
