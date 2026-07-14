import { keepPreviousData, useQuery } from '@tanstack/vue-query'
import { computed, type Ref } from 'vue'
import { prestamosDetalleQueryKeys } from '@/modules/balones/prestamos/constants/prestamosDetalleQueryKeys'
import { prestamosDetalleService } from '@/modules/balones/prestamos/services/prestamos-detalle.service'
import type { PrestamoDetalleListFilters } from '@/modules/balones/prestamos/interfaces/prestamo-detalle.interface'

export function usePrestamosDetalleQuery(filters: Ref<PrestamoDetalleListFilters>) {
  return useQuery({
    queryKey: computed(() => prestamosDetalleQueryKeys.list(filters.value)),
    queryFn: () => prestamosDetalleService.listar(filters.value),
    placeholderData: keepPreviousData,
    enabled: computed(() => (filters.value.idPrestamo ?? 0) > 0),
  })
}

export function usePrestamoDetalleQuery(id: Ref<number | null | undefined>) {
  return useQuery({
    queryKey: computed(() => prestamosDetalleQueryKeys.detail(id.value ?? 0)),
    queryFn: () => prestamosDetalleService.obtenerPorId(id.value!),
    enabled: computed(() => id.value != null && id.value > 0),
  })
}
