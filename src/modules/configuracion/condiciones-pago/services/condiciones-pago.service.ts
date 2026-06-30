import {
  apiDelete,
  apiGet,
  apiGetPaginated,
  apiPatch,
  apiPost,
} from '@/shared/api/apiClient'
import type {
  CondicionPago,
  CondicionPagoListFilters,
  CreateCondicionPagoPayload,
  DeleteCondicionPagoResponse,
  UpdateCondicionPagoPayload,
} from '@/modules/configuracion/condiciones-pago/interfaces/condicion-pago.interface'

export const condicionesPagoService = {
  listar(filters: CondicionPagoListFilters = {}) {
    return apiGetPaginated<CondicionPago>('/configuracion/condiciones-pago', { params: filters })
  },

  obtenerPorId(id: number) {
    return apiGet<CondicionPago>(`/configuracion/condiciones-pago/${id}`)
  },

  crear(payload: CreateCondicionPagoPayload) {
    return apiPost<CondicionPago>('/configuracion/condiciones-pago', payload)
  },

  actualizar(id: number, payload: UpdateCondicionPagoPayload) {
    return apiPatch<CondicionPago>(`/configuracion/condiciones-pago/${id}`, payload)
  },

  eliminar(id: number) {
    return apiDelete<DeleteCondicionPagoResponse>(`/configuracion/condiciones-pago/${id}`, {
      data: {},
    })
  },
}
