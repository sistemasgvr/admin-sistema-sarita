import { comprobantesService } from '@/modules/ventas/comprobantes/services/comprobantes.service'
import {
  openPdfPrintWindow,
  printBlobInWindow,
} from '@/modules/ventas/comprobantes/utils/comprobantePdf'

/**
 * Abre la ventana YA (en el clic del usuario) y luego emite/consulta.
 * Chrome bloquea window.open si se llama después de un await (p. ej. Emitir SUNAT).
 */
export function abrirVentanaTicketAlClic(): Window | null {
  return openPdfPrintWindow()
}

export async function cargarEImprimirTicketEnVentana(win: Window, id: number) {
  const blob = await comprobantesService.obtenerPdf(id, 'ticket')
  printBlobInWindow(win, blob)
}

export function debeImprimirTrasEmision(estadoSunat: string) {
  const estado = estadoSunat.toUpperCase()
  return estado === 'ACEPTADO' || estado === 'PENDIENTE'
}

/**
 * Flujo POS: abrir ventana en el mismo clic → emitir → imprimir ticket PDF 80mm.
 */
export async function emitirConImpresionTicket(options: {
  comprobanteId: number
  emitir: () => Promise<{ sunat: { estado: string } }>
}): Promise<'impreso' | 'sin_ventana' | 'no_imprimir'> {
  const win = abrirVentanaTicketAlClic()

  try {
    const data = await options.emitir()

    if (!debeImprimirTrasEmision(data.sunat.estado)) {
      win?.close()
      return 'no_imprimir'
    }

    if (!win) {
      return 'sin_ventana'
    }

    await cargarEImprimirTicketEnVentana(win, options.comprobanteId)
    return 'impreso'
  } catch (error) {
    win?.close()
    throw error
  }
}

/** Impresión manual (botón Imprimir ticket): abre ventana sincronamente. */
export async function imprimirTicketPorComprobanteId(id: number) {
  const win = openPdfPrintWindow()

  if (!win) {
    throw new Error(
      'El navegador bloqueó la ventana de impresión. En el candado de la URL, permite ventanas emergentes.',
    )
  }

  try {
    await cargarEImprimirTicketEnVentana(win, id)
  } catch (error) {
    win.close()
    throw error
  }
}

/**
 * Nota de venta / impresión local: abre ventana en el clic e imprime ticket
 * sin pasar por emisión SUNAT.
 */
export async function imprimirTicketSinEmision(
  comprobanteId: number,
): Promise<'impreso' | 'sin_ventana'> {
  const win = abrirVentanaTicketAlClic()

  if (!win) {
    return 'sin_ventana'
  }

  try {
    await cargarEImprimirTicketEnVentana(win, comprobanteId)
    return 'impreso'
  } catch (error) {
    win.close()
    throw error
  }
}
