import type { TrabajadorListFilters } from '@/modules/trabajadores/interfaces/trabajador.interface'

export const trabajadoresQueryKeys = {
  all: ['trabajadores'] as const,
  lists: () => [...trabajadoresQueryKeys.all, 'list'] as const,
  list: (filters: TrabajadorListFilters) =>
    [...trabajadoresQueryKeys.lists(), filters] as const,
  details: () => [...trabajadoresQueryKeys.all, 'detail'] as const,
  detail: (id: number) => [...trabajadoresQueryKeys.details(), id] as const,
}
