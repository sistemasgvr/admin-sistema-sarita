import { useQuery } from '@tanstack/vue-query'
import { computed, type Ref } from 'vue'
import { ubigeoQueryKeys } from '@/modules/catalogos/constants/catalogosQueryKeys'
import { ubigeoService } from '@/modules/catalogos/services/ubigeo.service'

type IdRef = Ref<number | string | null | undefined>

const toId = (value: number | string | null | undefined): number | undefined => {
  if (value === null || value === undefined || value === '') return undefined
  const num = Number(value)
  return Number.isNaN(num) ? undefined : num
}

export function usePaisesQuery() {
  return useQuery({
    queryKey: ubigeoQueryKeys.paises(),
    queryFn: () => ubigeoService.paises(),
    staleTime: 30 * 60 * 1000,
  })
}

export function useDepartamentosQuery(idPais: IdRef) {
  return useQuery({
    queryKey: computed(() => ubigeoQueryKeys.departamentos(toId(idPais.value))),
    queryFn: () => ubigeoService.departamentos(toId(idPais.value) as number),
    enabled: computed(() => toId(idPais.value) !== undefined),
    staleTime: 30 * 60 * 1000,
  })
}

export function useProvinciasQuery(idDepartamento: IdRef) {
  return useQuery({
    queryKey: computed(() => ubigeoQueryKeys.provincias(toId(idDepartamento.value))),
    queryFn: () => ubigeoService.provincias(toId(idDepartamento.value) as number),
    enabled: computed(() => toId(idDepartamento.value) !== undefined),
    staleTime: 30 * 60 * 1000,
  })
}

export function useDistritosQuery(idProvincia: IdRef) {
  return useQuery({
    queryKey: computed(() => ubigeoQueryKeys.distritos(toId(idProvincia.value))),
    queryFn: () => ubigeoService.distritos(toId(idProvincia.value) as number),
    enabled: computed(() => toId(idProvincia.value) !== undefined),
    staleTime: 30 * 60 * 1000,
  })
}
