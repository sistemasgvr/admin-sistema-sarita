import { keepPreviousData, useQuery } from '@tanstack/vue-query'
import { computed, type Ref } from 'vue'
import { alquileresDetalleQueryKeys } from '@/modules/balones/alquileres/constants/alquileresDetalleQueryKeys'
import { alquileresDetalleService } from '@/modules/balones/alquileres/services/alquileres-detalle.service'
import type { AlquilerDetalleListFilters } from '@/modules/balones/alquileres/interfaces/alquiler-detalle.interface'

export function useAlquileresDetalleQuery(filters: Ref<AlquilerDetalleListFilters>) {
  return useQuery({
    queryKey: computed(() => alquileresDetalleQueryKeys.list(filters.value)),
    queryFn: () => alquileresDetalleService.listar(filters.value),
    placeholderData: keepPreviousData,
    enabled: computed(() => (filters.value.idAlquiler ?? 0) > 0),
  })
}

export function useAlquilerDetalleQuery(id: Ref<number | null | undefined>) {
  return useQuery({
    queryKey: computed(() => alquileresDetalleQueryKeys.detail(id.value ?? 0)),
    queryFn: () => alquileresDetalleService.obtenerPorId(id.value!),
    enabled: computed(() => id.value != null && id.value > 0),
  })
}
