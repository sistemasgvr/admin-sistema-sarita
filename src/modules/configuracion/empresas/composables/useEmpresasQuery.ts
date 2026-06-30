import { keepPreviousData, useQuery } from '@tanstack/vue-query'
import { computed, type Ref } from 'vue'
import { empresasQueryKeys } from '@/modules/configuracion/empresas/constants/empresasQueryKeys'
import { empresasService } from '@/modules/configuracion/empresas/services/empresas.service'
import type { EmpresaListFilters } from '@/modules/configuracion/empresas/interfaces/empresa.interface'

export function useEmpresasQuery(filters: Ref<EmpresaListFilters>) {
  return useQuery({
    queryKey: computed(() => empresasQueryKeys.list(filters.value)),
    queryFn: () => empresasService.listar(filters.value),
    placeholderData: keepPreviousData,
  })
}
