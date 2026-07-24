import { useQuery } from '@tanstack/vue-query'
import { computed, type Ref } from 'vue'
import { configuracionSunatQueryKeys } from '@/modules/configuracion/sunat/constants/configuracionSunatQueryKeys'
import { configuracionSunatService } from '@/modules/configuracion/sunat/services/configuracion-sunat.service'

export function useConfiguracionSunatPorEmpresaQuery(
  idEmpresa: Ref<number | undefined>,
) {
  return useQuery({
    queryKey: computed(() =>
      idEmpresa.value != null
        ? configuracionSunatQueryKeys.byEmpresa(idEmpresa.value)
        : ([...configuracionSunatQueryKeys.all, 'by-empresa', 'none'] as const),
    ),
    enabled: computed(() => idEmpresa.value != null && idEmpresa.value > 0),
    queryFn: async () => {
      if (idEmpresa.value == null) return null

      const result = await configuracionSunatService.listar({
        pagina: 1,
        limite: 1,
        idEmpresa: idEmpresa.value,
      })
      return result.data[0] ?? null
    },
  })
}
