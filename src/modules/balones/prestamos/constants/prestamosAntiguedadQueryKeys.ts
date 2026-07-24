import type { PrestamoAntiguedadFilters } from '@/modules/balones/prestamos/interfaces/prestamo-antiguedad.interface'

export const prestamosAntiguedadQueryKeys = {
  all: ['balones', 'prestamos', 'antiguedad'] as const,
  list: (filters: PrestamoAntiguedadFilters) =>
    [...prestamosAntiguedadQueryKeys.all, 'list', filters] as const,
}
