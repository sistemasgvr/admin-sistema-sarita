import { apiGet } from '@/shared/api/apiClient'
import type { ListaOpcion } from '@/modules/catalogos/interfaces/lista-opcion.interface'

export const catalogosService = {
  listarListaOpciones(idLista: number) {
    return apiGet<ListaOpcion[]>(`/catalogos/listas/${idLista}/opciones`)
  },
}
