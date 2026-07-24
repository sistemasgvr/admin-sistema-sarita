import type { AlquilerAntiguedadFilters } from '@/modules/balones/alquileres/interfaces/alquiler-antiguedad.interface'

export const alquileresAntiguedadQueryKeys = {
  all: ['balones', 'alquileres', 'antiguedad'] as const,
  list: (filters: AlquilerAntiguedadFilters) =>
    [...alquileresAntiguedadQueryKeys.all, 'list', filters] as const,
}
