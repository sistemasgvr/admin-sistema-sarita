import { useQuery } from '@tanstack/vue-query'
import { computed, type Ref } from 'vue'
import { catalogosQueryKeys } from '@/modules/catalogos/constants/catalogosQueryKeys'
import { catalogosService } from '@/modules/catalogos/services/catalogos.service'

export function useListaOpcionesQuery(idLista: Ref<number>) {
  return useQuery({
    queryKey: computed(() => catalogosQueryKeys.listaOpciones(idLista.value)),
    queryFn: () => catalogosService.listarListaOpciones(idLista.value),
    enabled: computed(() => idLista.value > 0),
    staleTime: 5 * 60 * 1000,
  })
}
