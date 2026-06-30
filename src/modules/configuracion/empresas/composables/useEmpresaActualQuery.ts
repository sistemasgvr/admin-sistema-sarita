import { useQuery } from '@tanstack/vue-query'
import { empresasQueryKeys } from '@/modules/configuracion/empresas/constants/empresasQueryKeys'
import { empresasService } from '@/modules/configuracion/empresas/services/empresas.service'

export function useEmpresaActualQuery() {
  return useQuery({
    queryKey: empresasQueryKeys.current(),
    queryFn: async () => {
      const result = await empresasService.listar({ pagina: 1, limite: 1 })
      return result.data[0] ?? null
    },
  })
}
