import { useQuery } from '@tanstack/vue-query'
import { configuracionSunatQueryKeys } from '@/modules/configuracion/sunat/constants/configuracionSunatQueryKeys'
import { configuracionSunatService } from '@/modules/configuracion/sunat/services/configuracion-sunat.service'

export function useConfiguracionSunatActualQuery() {
  return useQuery({
    queryKey: configuracionSunatQueryKeys.current(),
    queryFn: async () => {
      const result = await configuracionSunatService.listar({ pagina: 1, limite: 1 })
      return result.data[0] ?? null
    },
  })
}
