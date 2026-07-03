import { useQuery } from '@tanstack/vue-query'
import { catalogosQueryKeys } from '@/modules/catalogos/constants/catalogosQueryKeys'
import { catalogosService } from '@/modules/catalogos/services/catalogos.service'
import type { CatalogoListaId } from '@/modules/catalogos/constants/catalogoListas'

export function useCatalogoOpcionesQuery(idLista: CatalogoListaId) {
  return useQuery({
    queryKey: catalogosQueryKeys.opciones(idLista),
    queryFn: () => catalogosService.listarOpciones(idLista),
    staleTime: 5 * 60 * 1000,
  })
}
