import { computed } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { empresasQueryKeys } from '../constants/empresasQueryKeys'
import { empresasService } from '../services/empresas.service'
import { useEmpresaSeleccionada } from './useEmpresaSeleccionada'

export function useEmpresaActualQuery() {
  const id = useEmpresaSeleccionada()
  return useQuery({
    queryKey: computed(() => [...empresasQueryKeys.current(), id.value]),
    queryFn: () => empresasService.obtenerPorId(id.value!),
    enabled: computed(() => id.value != null),
  })
}
