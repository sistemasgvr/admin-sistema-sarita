import {
  apiDelete,
  apiGet,
  apiGetPaginated,
  apiPatch,
  apiPost,
} from '@/shared/api/apiClient'
import type {
  CuentaBancaria,
  CuentaBancariaListFilters,
  CreateCuentaBancariaPayload,
  DeleteCuentaBancariaResponse,
  UpdateCuentaBancariaPayload,
} from '@/modules/cuentas-bancarias/interfaces/cuenta-bancaria.interface'

export const cuentasBancariasService = {
  listar(filters: CuentaBancariaListFilters = {}) {
    return apiGetPaginated<CuentaBancaria>('/cuentas-bancarias', { params: filters })
  },

  obtenerPorId(id: number) {
    return apiGet<CuentaBancaria>(`/cuentas-bancarias/${id}`)
  },

  crear(payload: CreateCuentaBancariaPayload) {
    return apiPost<CuentaBancaria>('/cuentas-bancarias', payload)
  },

  actualizar(id: number, payload: UpdateCuentaBancariaPayload) {
    return apiPatch<CuentaBancaria>(`/cuentas-bancarias/${id}`, payload)
  },

  eliminar(id: number, idUsuarioAuditoria: number) {
    return apiDelete<DeleteCuentaBancariaResponse>(`/cuentas-bancarias/${id}`, {
      data: { idUsuarioAuditoria },
    })
  },
}
