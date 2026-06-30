import type {
  UsuarioListFilters,
  UsuarioRolListFilters,
} from '@/modules/usuarios/interfaces/usuario.interface'

export const usuariosQueryKeys = {
  all: ['usuarios'] as const,
  lists: () => [...usuariosQueryKeys.all, 'list'] as const,
  list: (filters: UsuarioListFilters) => [...usuariosQueryKeys.lists(), filters] as const,
  details: () => [...usuariosQueryKeys.all, 'detail'] as const,
  detail: (id: number) => [...usuariosQueryKeys.details(), id] as const,
  roles: () => [...usuariosQueryKeys.all, 'roles'] as const,
  rolesList: (filters: UsuarioRolListFilters) =>
    [...usuariosQueryKeys.roles(), filters] as const,
}
