import { balonesService } from '@/modules/balones/cilindros/services/balones.service'
import { toastApiError } from '@/shared/composables/useToast'
import { visualizarArchivo } from '@/shared/utils/visualizarArchivo'

/**
 * Abre la etiqueta del cilindro en una pestaña nueva; desde ahí el usuario la
 * manda a la impresora de etiquetas (Ctrl+P). Se usa igual en el libro y en la ficha.
 */
export async function imprimirEtiquetaBalon(balon: { id: number; codigo_balon?: string | null }): Promise<void> {
  const codigo = balon.codigo_balon?.trim() || String(balon.id)
  try {
    await visualizarArchivo(() => balonesService.obtenerEtiquetaPdf(balon.id), `ETIQUETA-${codigo}.pdf`, 'pdf')
  } catch (error) {
    toastApiError(error, 'No se pudo generar la etiqueta')
  }
}
