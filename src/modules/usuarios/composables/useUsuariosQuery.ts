import { keepPreviousData, useQuery } from '@tanstack/vue-query'
import { computed, type Ref } from 'vue'
import { usuariosQueryKeys } from '@/modules/usuarios/constants/usuariosQueryKeys'
import { usuariosService } from '@/modules/usuarios/services/usuarios.service'
import type { UsuarioListFilters } from '@/modules/usuarios/interfaces/usuario.interface'

export function useUsuariosQuery(filters: Ref<UsuarioListFilters>) {
  return useQuery({
    queryKey: computed(() => usuariosQueryKeys.list(filters.value)),
    queryFn: () => usuariosService.listar(filters.value),
    placeholderData: keepPreviousData,
  })
}
