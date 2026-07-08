import {
  apiDelete,
  apiGet,
  apiGetPaginated,
  apiPatch,
  apiPost,
} from '@/shared/api/apiClient'
import type {
  Contacto,
  ContactoListFilters,
  CreateContactoPayload,
  DeleteContactoResponse,
  UpdateContactoPayload,
} from '@/modules/contactos/interfaces/contacto.interface'

export const contactosService = {
  listar(filters: ContactoListFilters = {}) {
    return apiGetPaginated<Contacto>('/contactos', { params: filters })
  },

  obtenerPorId(id: number) {
    return apiGet<Contacto>(`/contactos/${id}`)
  },

  crear(payload: CreateContactoPayload) {
    return apiPost<Contacto>('/contactos', payload)
  },

  actualizar(id: number, payload: UpdateContactoPayload) {
    return apiPatch<Contacto>(`/contactos/${id}`, payload)
  },

  eliminar(id: number) {
    return apiDelete<DeleteContactoResponse>(`/contactos/${id}`, {
      data: {},
    })
  },
}
