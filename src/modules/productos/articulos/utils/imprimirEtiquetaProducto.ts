import { productosService } from '@/modules/productos/articulos/services/productos.service'
import { toastApiError } from '@/shared/composables/useToast'
import { visualizarArchivo } from '@/shared/utils/visualizarArchivo'

/**
 * Abre la etiqueta 50 × 25 mm del producto en una pestaña nueva; desde ahí el
 * usuario la manda a la impresora de etiquetas (Ctrl+P).
 */
export async function imprimirEtiquetaProducto(producto: { id: number; codigo?: string | null }): Promise<void> {
  const codigo = producto.codigo?.trim() || String(producto.id)
  try {
    await visualizarArchivo(() => productosService.obtenerEtiquetaPdf(producto.id), `ETIQUETA-${codigo}.pdf`, 'pdf')
  } catch (error) {
    toastApiError(error, 'No se pudo generar la etiqueta')
  }
}
