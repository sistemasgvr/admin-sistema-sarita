import { useQuery } from '@tanstack/vue-query'
import { computed, type Ref } from 'vue'
import { usuariosQueryKeys } from '@/modules/usuarios/constants/usuariosQueryKeys'
import { usuariosRolesService } from '@/modules/usuarios/services/usuarios-roles.service'
import type { UsuarioRolListFilters } from '@/modules/usuarios/interfaces/usuario.interface'

export function useUsuarioRolesAsignadosQuery(filters: Ref<UsuarioRolListFilters>) {
  return useQuery({
    queryKey: computed(() => usuariosQueryKeys.rolesList(filters.value)),
    queryFn: () => usuariosRolesService.listar(filters.value),
    enabled: computed(() => Boolean(filters.value.idUsuario)),
  })
}
