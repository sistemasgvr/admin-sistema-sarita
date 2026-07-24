import { keepPreviousData, useQuery } from '@tanstack/vue-query'
import { computed, unref, type MaybeRef } from 'vue'
import { productoImagenesQueryKeys } from '@/modules/productos/articulos/constants/productoImagenesQueryKeys'
import { productoImagenesService } from '@/modules/productos/articulos/services/producto-imagenes.service'

export function useProductoImagenesQuery(idProducto: MaybeRef<number | null | undefined>) {
  const productId = computed(() => unref(idProducto) ?? null)

  return useQuery({
    queryKey: computed(() =>
      productoImagenesQueryKeys.list(productId.value ?? 0),
    ),
    queryFn: () =>
      productoImagenesService.listar(productId.value as number, { limite: 50 }),
    enabled: computed(() => Number(productId.value) > 0),
    placeholderData: keepPreviousData,
  })
}
