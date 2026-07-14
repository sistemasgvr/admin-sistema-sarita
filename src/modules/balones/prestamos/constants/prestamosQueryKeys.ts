import type { PrestamoListFilters } from '@/modules/balones/prestamos/interfaces/prestamo.interface'

export const prestamosQueryKeys = {
  all: ['prestamos'] as const,
  lists: () => [...prestamosQueryKeys.all, 'list'] as const,
  list: (filters: PrestamoListFilters) => [...prestamosQueryKeys.lists(), filters] as const,
  details: () => [...prestamosQueryKeys.all, 'detail'] as const,
  detail: (id: number) => [...prestamosQueryKeys.details(), id] as const,
}
