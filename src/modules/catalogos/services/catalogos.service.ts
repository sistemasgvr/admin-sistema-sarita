import { apiGet } from '@/shared/api/apiClient'
import type { CatalogoOpcion } from '@/modules/catalogos/interfaces/catalogo.interface'

export const catalogosService = {
  listarOpciones(idLista: number) {
    return apiGet<CatalogoOpcion[]>(`/catalogos/listas/${idLista}/opciones`)
  },
}
