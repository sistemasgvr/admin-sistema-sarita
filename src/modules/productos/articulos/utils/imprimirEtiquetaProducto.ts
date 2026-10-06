import { productosQueryKeys } from '@/modules/productos/articulos/constants/productosQueryKeys'
import { productosService } from '@/modules/productos/articulos/services/productos.service'
import { toastApiError } from '@/shared/composables/useToast'
import { queryClient } from '@/shared/plugins/vueQuery'
import { visualizarArchivo } from '@/shared/utils/visualizarArchivo'

/**
 * Abre la etiqueta 50 × 25 mm del producto en una pestaña nueva; desde ahí el
 * usuario la manda a la impresora de etiquetas (Ctrl+P). La etiqueta lleva el
 * código de barras del producto; si no tenía, la API le asigna uno al generarla,
 * por eso se refrescan los datos cacheados del producto.
 */
export async function imprimirEtiquetaProducto(producto: {
  id: number
  codigo?: string | null
  codigo_barra?: string | null
}): Promise<void> {
  const codigo = producto.codigo_barra?.trim() || producto.codigo?.trim() || String(producto.id)
  try {
    await visualizarArchivo(() => productosService.obtenerEtiquetaPdf(producto.id), `ETIQUETA-${codigo}.pdf`, 'pdf')
    if (!producto.codigo_barra?.trim()) {
      void queryClient.invalidateQueries({ queryKey: productosQueryKeys.all })
    }
  } catch (error) {
    toastApiError(error, 'No se pudo generar la etiqueta')
  }
}
