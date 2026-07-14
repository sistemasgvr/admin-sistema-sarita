import { keepPreviousData, useQuery } from '@tanstack/vue-query'
import { computed, type Ref } from 'vue'
import { prestamosQueryKeys } from '@/modules/balones/prestamos/constants/prestamosQueryKeys'
import { prestamosService } from '@/modules/balones/prestamos/services/prestamos.service'
import type { PrestamoListFilters } from '@/modules/balones/prestamos/interfaces/prestamo.interface'

export function usePrestamosQuery(filters: Ref<PrestamoListFilters>) {
  return useQuery({
    queryKey: computed(() => prestamosQueryKeys.list(filters.value)),
    queryFn: () => prestamosService.listar(filters.value),
    placeholderData: keepPreviousData,
  })
}

export function usePrestamoQuery(id: Ref<number | null | undefined>) {
  return useQuery({
    queryKey: computed(() => prestamosQueryKeys.detail(id.value ?? 0)),
    queryFn: () => prestamosService.obtenerPorId(id.value!),
    enabled: computed(() => id.value != null && id.value > 0),
  })
}
