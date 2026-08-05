import { apiGet, apiPost } from '@/shared/api/apiClient'
import type { ListaOpcion } from '@/modules/catalogos/interfaces/lista-opcion.interface'

export interface CreateListaOpcionPayload {
  nombre: string
  descripcion?: string
  idUsuarioAuditoria?: number
}

export const catalogosService = {
  listarListaOpciones(idLista: number) {
    return apiGet<ListaOpcion[]>(`/catalogos/listas/${idLista}/opciones`)
  },

  crearListaOpcion(idLista: number, payload: CreateListaOpcionPayload) {
    return apiPost<ListaOpcion>(`/catalogos/listas/${idLista}/opciones`, payload)
  },
}
