import { keepPreviousData, useQuery } from '@tanstack/vue-query'
import { computed, type Ref } from 'vue'
import { permisosQueryKeys } from '@/modules/permisos/constants/permisosQueryKeys'
import { permisosService } from '@/modules/permisos/services/permisos.service'
import type { PermisoListFilters } from '@/modules/permisos/interfaces/permiso.interface'

export function usePermisosQuery(filters: Ref<PermisoListFilters>) {
  return useQuery({
    queryKey: computed(() => permisosQueryKeys.list(filters.value)),
    queryFn: () => permisosService.listar(filters.value),
    placeholderData: keepPreviousData,
  })
}
