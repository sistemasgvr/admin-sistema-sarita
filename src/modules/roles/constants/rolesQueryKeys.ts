import type {
  RolListFilters,
  RolPermisoListFilters,
} from '@/modules/roles/interfaces/rol.interface'

export const rolesQueryKeys = {
  all: ['roles'] as const,
  lists: () => [...rolesQueryKeys.all, 'list'] as const,
  list: (filters: RolListFilters) => [...rolesQueryKeys.lists(), filters] as const,
  details: () => [...rolesQueryKeys.all, 'detail'] as const,
  detail: (id: number) => [...rolesQueryKeys.details(), id] as const,
  permisos: () => [...rolesQueryKeys.all, 'permisos'] as const,
  permisosList: (filters: RolPermisoListFilters) =>
    [...rolesQueryKeys.permisos(), filters] as const,
}
