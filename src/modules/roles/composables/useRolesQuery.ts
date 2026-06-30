import { keepPreviousData, useQuery } from '@tanstack/vue-query'
import { computed, type Ref } from 'vue'
import { rolesQueryKeys } from '@/modules/roles/constants/rolesQueryKeys'
import { rolesService } from '@/modules/roles/services/roles.service'
import type {
  RolListFilters,
  RolPermisoListFilters,
} from '@/modules/roles/interfaces/rol.interface'

export function useRolesQuery(filters: Ref<RolListFilters>) {
  return useQuery({
    queryKey: computed(() => rolesQueryKeys.list(filters.value)),
    queryFn: () => rolesService.listar(filters.value),
    placeholderData: keepPreviousData,
  })
}

export function useRolQuery(id: Ref<number | null>) {
  return useQuery({
    queryKey: computed(() => rolesQueryKeys.detail(id.value ?? 0)),
    queryFn: () => rolesService.obtenerPorId(id.value!),
    enabled: computed(() => id.value !== null && id.value > 0),
  })
}

export function useRolPermisosAsignadosQuery(filters: Ref<RolPermisoListFilters>) {
  return useQuery({
    queryKey: computed(() => rolesQueryKeys.permisosList(filters.value)),
    queryFn: () => rolesService.listarPermisosAsignados(filters.value),
    enabled: computed(() => Boolean(filters.value.idRol)),
  })
}
