import { useQuery } from '@tanstack/vue-query'
import { computed, type Ref } from 'vue'
import { bajasPendientesQueryKeys } from '@/modules/balones/bajas-pendientes/constants/bajasPendientesQueryKeys'
import type { BajaSolicitudListFilters } from '@/modules/balones/bajas-pendientes/interfaces/baja-solicitud.interface'
import { bajasPendientesService } from '@/modules/balones/bajas-pendientes/services/bajas-pendientes.service'

export function useBajasPendientesQuery(
  filters: Ref<BajaSolicitudListFilters>,
  options: { enabled?: Ref<boolean> | boolean } = {},
) {
  const enabled = computed(() => {
    const value = options.enabled
    if (value == null) return true
    return typeof value === 'boolean' ? value : value.value
  })

  return useQuery({
    queryKey: computed(() => bajasPendientesQueryKeys.list(filters.value)),
    queryFn: () => bajasPendientesService.listar(filters.value),
    enabled,
  })
}
