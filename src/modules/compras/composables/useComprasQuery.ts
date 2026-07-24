import { useQuery } from '@tanstack/vue-query'
import { computed, type Ref } from 'vue'
import { comprasQueryKeys } from '@/modules/compras/constants/comprasQueryKeys'
import { comprasService } from '@/modules/compras/services/compras.service'
import type { CompraListFilters } from '@/modules/compras/interfaces/compra.interface'

export function useComprasQuery(filters: Ref<CompraListFilters>) {
  return useQuery({
    queryKey: computed(() => comprasQueryKeys.list(filters.value)),
    queryFn: () => comprasService.listar(filters.value),
  })
}

export function useCompraQuery(id: Ref<number | null>) {
  return useQuery({
    queryKey: computed(() => comprasQueryKeys.detail(id.value ?? 0)),
    queryFn: () => comprasService.obtenerPorId(id.value!),
    enabled: computed(() => id.value != null && id.value > 0),
  })
}
