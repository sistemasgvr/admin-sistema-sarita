import { keepPreviousData, useQuery } from '@tanstack/vue-query'
import { computed, type Ref } from 'vue'
import { prestamosAntiguedadQueryKeys } from '@/modules/balones/prestamos/constants/prestamosAntiguedadQueryKeys'
import { prestamosAntiguedadService } from '@/modules/balones/prestamos/services/prestamos-antiguedad.service'
import type { PrestamoAntiguedadFilters } from '@/modules/balones/prestamos/interfaces/prestamo-antiguedad.interface'

export function usePrestamosAntiguedadQuery(filters: Ref<PrestamoAntiguedadFilters>) {
  return useQuery({
    queryKey: computed(() => prestamosAntiguedadQueryKeys.list(filters.value)),
    queryFn: () => prestamosAntiguedadService.listar(filters.value),
    placeholderData: keepPreviousData,
  })
}
